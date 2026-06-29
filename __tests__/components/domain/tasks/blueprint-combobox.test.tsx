import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { BlueprintCombobox } from '@/components/domain/tasks/blueprint-combobox';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'tasks.new': {
        select_blueprint: 'Select blueprint',
        search_blueprint: 'Search blueprints...',
        load_more: 'Load more',
        no_blueprints: 'No active blueprints',
        assign_for: 'Assign for {name}',
        manual_helper: 'Manual assignment at launch',
        select_users: 'Select users',
        search_users: 'Search users...',
        search_min_chars: 'Type at least 2 chars',
        no_users: 'No results',
        remove_user: 'Remove {name}',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

const mockBlueprints = [
  { public_id: 'bp-1', name_ar: 'نموذج اختبار', name_en: 'Test Blueprint', is_active: true, stages_count: '3', category: null },
  { public_id: 'bp-2', name_ar: 'نموذج حر', name_en: 'Free Flow', is_active: true, stages_count: '1', category: null },
];

beforeEach(() => {
  server.use(
    http.get('https://api.momentum.test/v1/blueprints', ({ request }) => {
      const url = new URL(request.url);
      const isActive = url.searchParams.get('is_active');
      const data = isActive === 'true' ? mockBlueprints : [];
      return HttpResponse.json({ data, next_cursor: null, has_more: false });
    }),
  );
});

test('renders placeholder when no blueprint selected', () => {
  renderWithProviders(<BlueprintCombobox />);
  expect(screen.getByRole('combobox')).toHaveTextContent('Select blueprint');
});

test('opens dropdown and lists active blueprints', async () => {
  const user = userEvent.setup();
  renderWithProviders(<BlueprintCombobox />);

  await user.click(screen.getByRole('combobox'));
  await screen.findByText('Test Blueprint');
  expect(screen.getByText('Free Flow')).toBeInTheDocument();
});

test('filters blueprints client-side by search text', async () => {
  const user = userEvent.setup();
  renderWithProviders(<BlueprintCombobox />);

  await user.click(screen.getByRole('combobox'));
  await screen.findByText('Test Blueprint');

  const input = screen.getByPlaceholderText('Search blueprints...');
  await user.type(input, 'Free');

  await waitFor(() => {
    expect(screen.queryByText('Test Blueprint')).not.toBeInTheDocument();
  });
  expect(screen.getByText('Free Flow')).toBeInTheDocument();
});

test('shows empty state when no blueprints match filter', async () => {
  const user = userEvent.setup();
  renderWithProviders(<BlueprintCombobox />);

  await user.click(screen.getByRole('combobox'));
  const input = screen.getByPlaceholderText('Search blueprints...');
  await user.type(input, 'zzzzzzz');

  await waitFor(() => {
    expect(screen.getByText('No active blueprints')).toBeInTheDocument();
  });
});

test('shows loading skeleton', () => {
  server.use(
    http.get('https://api.momentum.test/v1/blueprints', async () => {
      await new Promise(() => {}); // never resolves
      return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
    }),
  );

  renderWithProviders(<BlueprintCombobox />);
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});
