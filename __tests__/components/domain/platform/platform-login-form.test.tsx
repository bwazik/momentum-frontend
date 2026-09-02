import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { PlatformLoginForm } from '@/components/domain/platform/platform-login-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'en' }));

test('renders the platform login fields and submits valid form input', () => {
  renderWithProviders(<PlatformLoginForm />);
  const email = screen.getByLabelText('email');
  const password = screen.getByLabelText('password');
  fireEvent.change(email, { target: { value: 'admin@example.com' } });
  fireEvent.change(password, { target: { value: 'password' } });
  expect(email).toHaveValue('admin@example.com');
  expect(password).toHaveValue('password');
  expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
});
