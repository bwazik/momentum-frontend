import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { HelpCenterPageClient } from '@/components/domain/help/help-center-page-client';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';
import type { HelpArticleCategory, HelpArticle } from '@/lib/api/types/help-center-types';

const mockCategories: HelpArticleCategory[] = [
  {
    public_id: 'cat-1',
    name_ar: 'إدارة المهام',
    name_en: 'Task Management',
    display_order: 0,
    is_active: true,
    article_count: 5,
  },
  {
    public_id: 'cat-2',
    name_ar: 'المخططات وسير العمل',
    name_en: 'Blueprints & Workflows',
    display_order: 1,
    is_active: true,
    article_count: 3,
  },
];

const mockArticles: HelpArticle[] = [
  {
    public_id: 'art-1',
    title_ar: 'كيفية إنشاء مهمة جديدة',
    title_en: 'How to create a new task',
    category: {
      public_id: 'cat-1',
      name_ar: 'إدارة المهام',
      name_en: 'Task Management',
    },
    is_published: true,
    display_order: 0,
    view_count: 142,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-02T10:00:00Z',
  },
  {
    public_id: 'art-2',
    title_ar: 'دليل إعداد المخطط',
    title_en: 'Blueprint setup guide',
    category: {
      public_id: 'cat-2',
      name_ar: 'المخططات وسير العمل',
      name_en: 'Blueprints & Workflows',
    },
    is_published: false,
    display_order: 1,
    view_count: 20,
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-04T10:00:00Z',
  },
];

const mockReplace = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(currentSearch),
  usePathname: () => '/help',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params?.query) return `Search results for "${params.query}"`;
    return key;
  },
  useLocale: () => 'en',
}));

describe('HelpCenterPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearch = '';
    useCapabilityStore.setState({ capabilities: ['helpcenter.view'] });

    server.use(
      http.get('*/v1/help-center/categories', () => {
        return HttpResponse.json(mockCategories);
      }),
      http.get('*/v1/help-center/articles', () => {
        return HttpResponse.json({
          data: mockArticles,
          next_cursor: null,
          has_more: false,
        });
      }),
      http.get('*/v1/help-center/search', () => {
        return HttpResponse.json({
          data: [mockArticles[0]],
          next_cursor: null,
          has_more: false,
        });
      })
    );
  });

  it('renders permission denied if user has neither helpcenter.view nor helpcenter.manage', async () => {
    useCapabilityStore.setState({ capabilities: [] });
    renderWithProviders(<HelpCenterPageClient />);

    expect(await screen.findByTestId('help-permission-denied')).toBeInTheDocument();
  });

  it('renders directory with categories, featured articles, and article list for helpcenter.view', async () => {
    renderWithProviders(<HelpCenterPageClient />);

    // Search hero is rendered
    expect(await screen.findByTestId('help-search-hero')).toBeInTheDocument();

    // Category grid
    expect(await screen.findByTestId('help-category-grid')).toBeInTheDocument();
    expect(screen.getAllByText('Task Management').length).toBeGreaterThanOrEqual(1);

    // Articles list
    expect(await screen.findByTestId('help-article-list')).toBeInTheDocument();
    expect(screen.getAllByText('How to create a new task').length).toBeGreaterThanOrEqual(1);

    // Management CTA should NOT be visible
    expect(screen.queryByText('articles.create_article_btn')).not.toBeInTheDocument();
  });

  it('renders management actions when user has helpcenter.manage', async () => {
    useCapabilityStore.setState({ capabilities: ['helpcenter.view', 'helpcenter.manage'] });
    renderWithProviders(<HelpCenterPageClient />);

    expect(await screen.findByText('articles.create_article_btn')).toBeInTheDocument();
    expect(screen.getByText('articles.manage_categories_btn')).toBeInTheDocument();
  });

  it('switches to search results when search query is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HelpCenterPageClient />);

    const searchInput = await screen.findByRole('textbox', { name: 'search_placeholder' });
    await user.type(searchInput, 'task');

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it('handles empty state when no articles match', async () => {
    server.use(
      http.get('*/v1/help-center/articles', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      })
    );

    renderWithProviders(<HelpCenterPageClient />);
    expect(await screen.findByTestId('help-article-list-empty')).toBeInTheDocument();
  });
});
