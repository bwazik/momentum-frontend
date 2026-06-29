import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { ManualAssignmentBlock } from '@/components/domain/tasks/manual-assignment-block';

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

vi.mock('@/lib/api/hooks/use-task-detail', () => ({
  useUsersSearch: () => ({ data: { data: [] }, isFetching: false }),
}));

const stageItem = {
  kind: 'stage' as const,
  public_id: 'stage-1',
  name_ar: 'مرحلة التقديم',
  name_en: 'Submission Stage',
};

const subStageItem = {
  kind: 'sub' as const,
  public_id: 'sub-stage-1',
  name_ar: 'مرحلة فرعية',
  name_en: 'Sub Stage',
};

test('renders label with stage name', () => {
  renderWithProviders(<ManualAssignmentBlock item={stageItem} />);
  expect(screen.getByText(/Assign for/)).toBeInTheDocument();
});

test('renders helper text', () => {
  renderWithProviders(<ManualAssignmentBlock item={stageItem} />);
  expect(screen.getByText('Manual assignment at launch')).toBeInTheDocument();
});

test('renders with sub-stage item', () => {
  renderWithProviders(<ManualAssignmentBlock item={subStageItem} />);
  expect(screen.getByText(/Assign for/)).toBeInTheDocument();
});

test('renders placeholder button for user combobox', () => {
  renderWithProviders(<ManualAssignmentBlock item={stageItem} />);
  expect(screen.getByText('Select users')).toBeInTheDocument();
});
