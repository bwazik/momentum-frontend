import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { AdminsTabPanel } from '@/components/domain/platform/admins/admins-tab-panel';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

test('shows the admins empty state when the platform API returns no admins', async () => {
  server.use(
    http.get('*/v1/platform/auth/me', () =>
      HttpResponse.json({
        public_id: 'admin-me',
        name_ar: 'المدير',
        name_en: 'Admin Me',
        email: 'me@momentum.test',
        account_type: 'platform_admin',
        is_active: true,
      })
    ),
    http.get('*/v1/platform/admins', () =>
      HttpResponse.json({ data: [], next_cursor: null, has_more: false })
    )
  );

  renderWithProviders(<AdminsTabPanel />);
  expect(await screen.findByText('empty_title')).toBeInTheDocument();
});

test('renders administrators in table when data is returned', async () => {
  server.use(
    http.get('*/v1/platform/auth/me', () =>
      HttpResponse.json({
        public_id: 'admin-me',
        name_ar: 'المدير',
        name_en: 'Admin Me',
        email: 'me@momentum.test',
        account_type: 'platform_admin',
        is_active: true,
      })
    ),
    http.get('*/v1/platform/admins', () =>
      HttpResponse.json({
        data: [
          {
            public_id: 'admin-1',
            name_ar: 'أحمد المنصوري',
            name_en: 'Ahmed Al-Mansouri',
            email: 'ahmed@momentum.test',
            account_type: 'platform_admin',
            is_active: true,
            created_at: '2026-08-01T00:00:00.000000Z',
            updated_at: '2026-08-01T00:00:00.000000Z',
          },
        ],
        next_cursor: null,
        has_more: false,
      })
    )
  );

  renderWithProviders(<AdminsTabPanel />);
  const nameElements = await screen.findAllByText('Ahmed Al-Mansouri');
  expect(nameElements.length).toBeGreaterThan(0);
  const emailElements = screen.getAllByText('ahmed@momentum.test');
  expect(emailElements.length).toBeGreaterThan(0);
});
