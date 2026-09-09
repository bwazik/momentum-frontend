import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { HelpArticleEditorPageClient } from '@/components/domain/help/help-article-editor-page-client';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';
import type { HelpArticleCategory, HelpArticleDetail } from '@/lib/api/types/help-center-types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCategories: HelpArticleCategory[] = [
  {
    public_id: 'cat-1',
    name_ar: 'عام',
    name_en: 'General',
    display_order: 0,
    is_active: true,
  },
];

const mockArticle: HelpArticleDetail = {
  public_id: 'art-1',
  title_ar: 'المقال التجريبي',
  title_en: 'Test Article',
  body_ar: 'محتوى المقال العربي',
  body_en: 'English article body',
  category: {
    public_id: 'cat-1',
    name_ar: 'عام',
    name_en: 'General',
  },
  is_published: false,
  display_order: 0,
  view_count: 10,
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
};

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/help/new',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

describe('HelpArticleEditorPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCapabilityStore.setState({ capabilities: ['helpcenter.manage'] });

    server.use(
      http.get('*/v1/help-center/categories', () => {
        return HttpResponse.json(mockCategories);
      }),
      http.get('*/v1/help-center/articles/art-1', () => {
        return HttpResponse.json(mockArticle);
      }),
      http.get('*/v1/help-center/articles/art-1/documents', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      }),
      http.post('*/v1/help-center/articles', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ...mockArticle,
          public_id: 'art-new',
          ...body,
        });
      })
    );
  });

  it('denies access if user lacks helpcenter.manage', async () => {
    useCapabilityStore.setState({ capabilities: ['helpcenter.view'] });

    renderWithProviders(<HelpArticleEditorPageClient mode="create" />);
    expect(await screen.findByTestId('help-permission-denied')).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HelpArticleEditorPageClient mode="create" />);

    const saveDraftBtn = await screen.findByRole('button', { name: /save_draft/i });
    await user.click(saveDraftBtn);

    expect(toast.error).toHaveBeenCalledWith('category_required');
  });

  it('toggles write and preview tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HelpArticleEditorPageClient mode="create" />);

    const writeTabBtn = await screen.findByRole('button', { name: /write_tab/i });
    const previewTabBtn = screen.getByRole('button', { name: /preview_tab/i });

    expect(writeTabBtn).toBeInTheDocument();
    expect(previewTabBtn).toBeInTheDocument();

    // Switch to preview
    await user.click(previewTabBtn);
    expect(screen.getByText('preview_empty')).toBeInTheDocument();

    // Switch back to write
    await user.click(writeTabBtn);
    expect(screen.getByPlaceholderText(/Markdown/i)).toBeInTheDocument();
  });

  it('pre-fills fields in edit mode', async () => {
    renderWithProviders(
      <HelpArticleEditorPageClient mode="edit" publicId="art-1" />
    );

    expect(await screen.findByDisplayValue('المقال التجريبي')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Article')).toBeInTheDocument();
  });
});
