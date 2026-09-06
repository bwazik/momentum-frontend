import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { ImpersonationTabPanel } from '@/components/domain/platform/impersonation/impersonation-tab-panel';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

test('shows empty state when no active impersonation sessions exist', async () => {
  server.use(
    http.get('*/v1/platform/impersonation-sessions', () =>
      HttpResponse.json({ data: [], next_cursor: null, has_more: false })
    )
  );
  renderWithProviders(<ImpersonationTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});

test('renders active sessions in table when present', async () => {
  server.use(
    http.get('*/v1/platform/impersonation-sessions', () =>
      HttpResponse.json({
        data: [
          {
            public_id: 'session-1',
            user_id: 'admin-1',
            action: 'impersonation.start',
            entity_type: 'impersonation',
            entity_id: '1',
            payload: {
              tenant_slug: 'mof',
              tenant_public_id: 'tenant-mof-uuid',
              target_user_id: 'user-noura-uuid',
              target_email: 'noura@mof.test',
            },
            created_at: '2026-09-03T01:00:00.000000Z',
          },
        ],
        next_cursor: null,
        has_more: false,
      })
    )
  );
  renderWithProviders(<ImpersonationTabPanel />);
  // Both the desktop table and mobile card list render the data; JSDOM ignores
  // media-query visibility so we assert at least one match is in the document.
  const mofElements = await screen.findAllByText('mof');
  expect(mofElements.length).toBeGreaterThan(0);
  const emailElements = screen.getAllByText('noura@mof.test');
  expect(emailElements.length).toBeGreaterThan(0);
});
