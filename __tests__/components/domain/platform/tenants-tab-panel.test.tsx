import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { TenantsTabPanel } from '@/components/domain/platform/tenants/tenants-tab-panel';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), usePathname: () => '/' }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'en' }));

test('shows the tenant empty state when the platform API returns no tenants', async () => {
  server.use(http.get('*/v1/platform/tenants', () => HttpResponse.json({ data: [], next_cursor: null, has_more: false })));
  renderWithProviders(<TenantsTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});
