import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { HelpArticleReaderPageClient } from '@/components/domain/help/help-article-reader-page-client';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';
import type { HelpArticleDetail } from '@/lib/api/types/help-center-types';

const mockArticle: HelpArticleDetail = {
  public_id: 'art-100',
  title_ar: 'دليل المستخدم الشامل',
  title_en: 'Comprehensive User Guide',
  body_ar: '<p>مرحبا بكم في <strong>المنصة</strong>.</p><script>alert("xss")</script>',
  body_en: '<p>Welcome to <strong>the platform</strong>.</p><img src="valid.png" alt="preview" /><script>alert("xss")</script>',
  category: {
    public_id: 'cat-1',
    name_ar: 'عام',
    name_en: 'General',
  },
  is_published: true,
  display_order: 0,
  view_count: 530,
  author: {
    public_id: 'usr-1',
    name_ar: 'محمد أحمد',
    name_en: 'Mohammed Ahmed',
  },
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-02T15:00:00Z',
  published_at: '2026-09-01T14:00:00Z',
};

const mockDraftArticle: HelpArticleDetail = {
  ...mockArticle,
  public_id: 'art-draft',
  is_published: false,
};

const mockDocuments = [
  {
    public_id: 'doc-1',
    original_name: 'workflow-schematic.png',
    file_size: 102400,
    mime_type: 'image/png',
    download_url: 'https://api.momentum.test/v1/help-center/articles/art-100/documents/doc-1/download',
    preview_url: 'https://api.momentum.test/v1/help-center/articles/art-100/documents/doc-1/preview',
    created_at: '2026-09-01T12:00:00Z',
  },
];

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/help/art-100',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

describe('HelpArticleReaderPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCapabilityStore.setState({ capabilities: ['helpcenter.view'] });

    server.use(
      http.get('*/v1/help-center/articles/art-100', () => {
        return HttpResponse.json(mockArticle);
      }),
      http.get('*/v1/help-center/articles/art-draft', () => {
        return HttpResponse.json(mockDraftArticle);
      }),
      http.get('*/v1/help-center/articles/:publicId/documents', () => {
        return HttpResponse.json({
          data: mockDocuments,
          next_cursor: null,
          has_more: false,
        });
      }),
      http.get('*/v1/help-center/articles', () => {
        return HttpResponse.json({
          data: [],
          next_cursor: null,
          has_more: false,
        });
      })
    );
  });

  it('renders published article with sanitized content and attachments', async () => {
    renderWithProviders(<HelpArticleReaderPageClient publicId="art-100" />);

    expect(await screen.findByText('Comprehensive User Guide')).toBeInTheDocument();
    expect(screen.getByText('Mohammed Ahmed')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();

    // Verify sanitized prose content
    const content = await screen.findByTestId('help-article-content');
    expect(content).toBeInTheDocument();
    expect(content.innerHTML).toContain('Welcome to');
    expect(content.innerHTML).not.toContain('<script>');

    // Verify attachments gallery
    expect(await screen.findByTestId('help-attachments-gallery')).toBeInTheDocument();
    expect(screen.getByText('workflow-schematic.png')).toBeInTheDocument();
  });

  it('renders draft warning alert for managers on unpublished draft', async () => {
    useCapabilityStore.setState({ capabilities: ['helpcenter.view', 'helpcenter.manage'] });

    renderWithProviders(<HelpArticleReaderPageClient publicId="art-draft" />);

    expect(await screen.findByTestId('draft-warning-banner')).toBeInTheDocument();
    expect(screen.getByText('articles.draft_warning_title')).toBeInTheDocument();
  });

  it('renders edit and publish buttons when user has helpcenter.manage', async () => {
    useCapabilityStore.setState({ capabilities: ['helpcenter.view', 'helpcenter.manage'] });

    renderWithProviders(<HelpArticleReaderPageClient publicId="art-100" />);

    expect(await screen.findByText('articles.edit_btn')).toBeInTheDocument();
    expect(screen.getByText('articles.unpublish_btn')).toBeInTheDocument();
  });

  it('renders error state on 404 not found', async () => {
    server.use(
      http.get('*/v1/help-center/articles/non-existent', () => {
        return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
      })
    );

    renderWithProviders(<HelpArticleReaderPageClient publicId="non-existent" />);

    expect(await screen.findByTestId('help-article-error')).toBeInTheDocument();
  });

  it('renders pure markdown with structured headings and lists', async () => {
    const markdownArticle: HelpArticleDetail = {
      ...mockArticle,
      public_id: 'art-md',
      slug: 'my-custom-slug',
      body_en: '## 1. Overview\n\nThis is paragraph one.\n\n- Bullet item A\n- Bullet item B',
    };

    server.use(
      http.get('*/v1/help-center/articles/my-custom-slug', () => {
        return HttpResponse.json(markdownArticle);
      })
    );

    renderWithProviders(<HelpArticleReaderPageClient publicId="my-custom-slug" />);

    const content = await screen.findByTestId('help-article-content');
    expect(content.querySelector('h2')?.textContent).toContain('1. Overview');
    expect(content.querySelectorAll('li')).toHaveLength(2);
  });

  it('generates edit link with slug when slug is available', async () => {
    useCapabilityStore.setState({ capabilities: ['helpcenter.view', 'helpcenter.manage'] });

    const articleWithSlug: HelpArticleDetail = {
      ...mockArticle,
      public_id: 'art-slug-1',
      slug: 'awesome-article-slug',
    };

    server.use(
      http.get('*/v1/help-center/articles/art-slug-1', () => {
        return HttpResponse.json(articleWithSlug);
      })
    );

    renderWithProviders(<HelpArticleReaderPageClient publicId="art-slug-1" />);

    const editBtn = await screen.findByText('articles.edit_btn');
    const editLink = editBtn.closest('a');
    expect(editLink).toHaveAttribute('href', '/help/awesome-article-slug/edit');
  });
});
