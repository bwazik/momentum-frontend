import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { AuditTabPanel } from '@/components/domain/platform/audit/audit-tab-panel';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), usePathname: () => '/' }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'en' }));

test('shows the audit empty state when the platform API returns no events', async () => {
  server.use(http.get('https://api.momentum.test/v1/platform/audit-events', () => HttpResponse.json({ data: [], next_cursor: null, has_more: false })));
  renderWithProviders(<AuditTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});
