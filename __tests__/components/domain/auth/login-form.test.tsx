import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { LoginForm } from '@/components/domain/auth/login-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'en' }));

describe('LoginForm', () => {
  test('renders tenant login form with extra links by default', () => {
    renderWithProviders(<LoginForm variant="tenant" />);
    
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
    expect(screen.getByText('forgot_password')).toBeInTheDocument();
    expect(screen.getByText('sign_up')).toBeInTheDocument();
    expect(screen.getByText('terms')).toBeInTheDocument();
  });

  test('renders platform login form omitting public signup and terms links', () => {
    renderWithProviders(<LoginForm variant="platform" />);
    
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
    expect(screen.queryByText('forgot_password')).not.toBeInTheDocument();
    expect(screen.queryByText('sign_up')).not.toBeInTheDocument();
    expect(screen.queryByText('terms')).not.toBeInTheDocument();
  });

  test('accepts custom title and field values', () => {
    renderWithProviders(<LoginForm variant="platform" title="Platform Portal" />);
    
    expect(screen.getByText('Platform Portal')).toBeInTheDocument();
    const email = screen.getByLabelText('email');
    const password = screen.getByLabelText('password');
    fireEvent.change(email, { target: { value: 'admin@momentum.test' } });
    fireEvent.change(password, { target: { value: 'secret123' } });
    expect(email).toHaveValue('admin@momentum.test');
    expect(password).toHaveValue('secret123');
  });
});
