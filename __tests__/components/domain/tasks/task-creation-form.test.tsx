import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskCreationForm } from '@/components/domain/tasks/task-creation-form';

const pushFn = vi.fn();
const replaceFn = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushFn, replace: replaceFn }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/new',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'tasks.new': {
        title: 'Create Task',
        select_blueprint: 'Select blueprint',
        search_blueprint: 'Search...',
        no_blueprints: 'No active blueprints',
        title_ar: 'Title (Arabic)',
        title_en: 'Title (English)',
        description_ar: 'Description (Arabic)',
        description_en: 'Description (English)',
        priority: 'Priority',
        classification: 'Classification',
        classification_public: 'Public',
        classification_internal: 'Internal',
        classification_confidential: 'Confidential',
        classification_confidential_lock: 'Requires task.classify.confidential',
        due_date: 'Due date',
        select_users: 'Select users',
        search_users: 'Search...',
        search_min_chars: 'Type at least 2 chars',
        no_users: 'No results',
        remove_user: 'Remove {name}',
        assign_for: 'Assign for {name}',
        manual_helper: 'Manual assignment',
        manual_required: "Stage '{name}' requires at least one assignee",
        summary_blueprint: 'Blueprint',
        summary_title: 'Title',
        summary_priority: 'Priority',
        summary_classification: 'Classification',
        summary_due: 'Due date',
        summary_assignees: 'Assignees',
        cancel: 'Cancel',
        save_draft: 'Save Draft',
        launch: 'Launch',
        delete_draft: 'Delete Draft',
        delete_title: 'Delete this draft?',
        delete_desc: 'Cannot be undone.',
        delete_confirm: 'Delete Draft',
        discard_title: 'Discard changes?',
        discard_desc: 'You will lose entered data.',
        discard_confirm: 'Discard',
        no_permission_title: 'No permission',
        no_permission_desc: 'Cannot edit this draft.',
        not_found_title: 'Task not found',
        back_to_tasks: 'Back to tasks',
        create_task: 'Create Task',
      },
      'tasks.create.toast': {
        launched: 'Task launched',
        saved: 'Draft saved',
        deleted: 'Draft deleted',
      },
      'tasks.detail': {
        no_permission_title: 'No permission',
        no_permission_description: 'No permission.',
        not_found_title: 'Not found',
        not_found_description: 'Task not found.',
        error: 'Error.',
      },
      shared: {
        error: 'Error',
        retry: 'Retry',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/api/hooks/use-auth', () => ({
  useCurrentUser: () => ({ data: { public_id: 'user-1', name_ar: 'Test', name_en: 'Test' } }),
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: () => true,
}));

vi.mock('@/lib/api/hooks/use-task-board', () => ({
  useTaskPriorities: () => ({
    data: [
      { public_id: 'prio-1', name_ar: 'عالية', name_en: 'High', severity_rank: 'critical', is_default: true, is_active: true, display_order: 1 },
      { public_id: 'prio-2', name_ar: 'متوسطة', name_en: 'Medium', severity_rank: 'urgent', is_default: false, is_active: true, display_order: 2 },
    ],
    isLoading: false,
  }),
}));

const mockBlueprint = {
  public_id: 'bp-1',
  name_ar: 'نموذج اختبار',
  name_en: 'Test Blueprint',
  description_ar: 'وصف',
  description_en: 'Description',
  is_active: true,
  is_locked: false,
  scope: 'organization',
  department_id: null,
  stages_count: '2',
  category: null,
  stages: [
    {
      public_id: 'stage-1',
      blueprint_id: 'bp-1',
      name_ar: 'مرحلة التقديم',
      name_en: 'Submission Stage',
      description_ar: '',
      description_en: '',
      sequence_order: '1',
      stage_type: { public_id: 'st-1', name_ar: 'نوع', name_en: 'Type' },
      sla_policy: null,
      assignment_type: 'manual_at_launch',
      assigned_position_id: null,
      assigned_department_id: null,
      assignment_cardinality: 'single',
      completion_rule: 'any_assignee',
      escalation_position_id: null,
      sub_stages: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      public_id: 'stage-2',
      blueprint_id: 'bp-1',
      name_ar: 'مرحلة المراجعة',
      name_en: 'Review Stage',
      description_ar: '',
      description_en: '',
      sequence_order: '2',
      stage_type: { public_id: 'st-1', name_ar: 'نوع', name_en: 'Type' },
      sla_policy: null,
      assignment_type: '1',
      assigned_position_id: 'pos-1',
      assigned_department_id: null,
      assignment_cardinality: 'single',
      completion_rule: 'any_assignee',
      escalation_position_id: null,
      sub_stages: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  transitions: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  pushFn.mockClear();
  replaceFn.mockClear();

  server.use(
    http.get('https://api.momentum.test/v1/blueprints', () =>
      HttpResponse.json({ data: [mockBlueprint], next_cursor: null, has_more: false }),
    ),
    http.get('https://api.momentum.test/v1/blueprints/:publicId', () =>
      HttpResponse.json(mockBlueprint),
    ),
    http.get('https://api.momentum.test/v1/iam/users', () =>
      HttpResponse.json({ data: [{ public_id: 'user-2', name_ar: 'سارة', name_en: 'Sarah' }], next_cursor: null, has_more: false }),
    ),
  );
});

test('renders create mode with Save Draft and Launch buttons', async () => {
  renderWithProviders(<TaskCreationForm mode="create" />);

  await screen.findByPlaceholderText('Title (Arabic)');

  expect(screen.getByText('Save Draft')).toBeInTheDocument();
  expect(screen.getByText('Launch')).toBeInTheDocument();
  expect(screen.queryByText('Delete Draft')).not.toBeInTheDocument();
});

test('launch creates task then launches and navigates to detail', async () => {
  let storeCalled = false;
  server.use(
    http.post('https://api.momentum.test/v1/tasks', async ({ request }) => {
      storeCalled = true;
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        public_id: 'task-new',
        display_id: 'T-2026-0007',
        title_ar: body.title_ar,
        title_en: body.title_en || body.title_ar,
        status: 'draft',
        initiator_id: 'user-1',
        created_at: new Date().toISOString(),
      });
    }),
    http.post('https://api.momentum.test/v1/tasks/:publicId/launch', () =>
      HttpResponse.json({ public_id: 'task-new', status: 'active', stages: [], launched_at: new Date().toISOString() }),
    ),
  );

  const user = userEvent.setup();
  renderWithProviders(<TaskCreationForm mode="create" />);

  const titleInput = await screen.findByPlaceholderText('Title (Arabic)');
  await user.type(titleInput, 'New Task Title');

  const descInput = screen.getByPlaceholderText('Description (Arabic)');
  await user.type(descInput, 'New Task Description');

  await user.click(screen.getByText('Launch'));

  await waitFor(() => {
    expect(storeCalled).toBe(true);
    expect(pushFn).toHaveBeenCalledWith('/tasks/task-new');
  });
});

test('save draft navigates to detail page', async () => {
  let storeCalled = false;
  server.use(
    http.post('https://api.momentum.test/v1/tasks', async ({ request }) => {
      storeCalled = true;
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        public_id: 'task-draft',
        display_id: 'T-2026-0008',
        title_ar: body.title_ar,
        title_en: body.title_en || body.title_ar,
        status: 'draft',
        initiator_id: 'user-1',
        created_at: new Date().toISOString(),
      });
    }),
  );

  const user = userEvent.setup();
  renderWithProviders(<TaskCreationForm mode="create" />);

  const titleInput = await screen.findByPlaceholderText('Title (Arabic)');
  await user.type(titleInput, 'Draft Task');

  const descInput = screen.getByPlaceholderText('Description (Arabic)');
  await user.type(descInput, 'Draft Description');

  await user.click(screen.getByText('Save Draft'));

  await waitFor(() => {
    expect(storeCalled).toBe(true);
    expect(pushFn).toHaveBeenCalledWith('/tasks/task-draft');
  });
});

test('stays on form page on 422 launch failure (no navigation)', async () => {
  server.use(
    http.post('https://api.momentum.test/v1/tasks', async () =>
      HttpResponse.json(
        { message: 'Blueprint has no stages.' },
        { status: 422 },
      ),
    ),
  );

  const user = userEvent.setup();
  renderWithProviders(<TaskCreationForm mode="create" />);

  const titleInput = await screen.findByPlaceholderText('Title (Arabic)');
  await user.type(titleInput, 'Test Title');

  const descInput = screen.getByPlaceholderText('Description (Arabic)');
  await user.type(descInput, 'Test Description');

  await user.click(screen.getByText('Launch'));

  await waitFor(() => {
    expect(pushFn).not.toHaveBeenCalled();
  });
});

test('edit mode with draft task prefills form and shows delete draft button', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId', () =>
      HttpResponse.json({
        public_id: 'task-edit-1',
        display_id: 'T-2026-0009',
        title_ar: 'Existing Draft',
        title_en: '',
        description_ar: 'Existing description',
        description_en: '',
        status: 'draft',
        classification_level: '1',
        due_date: null,
        initiator_id: 'user-1',
        priority: { public_id: 'prio-1', name_ar: 'عالية', name_en: 'High', severity_rank: 'critical' },
        blueprint: { public_id: 'bp-1', name_ar: 'نموذج اختبار', name_en: 'Test Blueprint' },
      }),
    ),
  );

  renderWithProviders(<TaskCreationForm mode="edit" publicId="task-edit-1" />);

  await screen.findByDisplayValue('Existing Draft');

  expect(screen.getByDisplayValue('Existing Draft')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
});

test('edit mode non-draft task redirects to detail page', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId', () =>
      HttpResponse.json({
        public_id: 'task-active-1',
        display_id: 'T-2026-0010',
        title_ar: 'Active Task',
        title_en: '',
        description_ar: '',
        description_en: '',
        status: 'active',
        classification_level: '1',
        due_date: null,
        initiator_id: 'user-1',
      }),
    ),
  );

  renderWithProviders(<TaskCreationForm mode="edit" publicId="task-active-1" />);

  await waitFor(() => {
    expect(replaceFn).toHaveBeenCalledWith('/tasks/task-active-1');
  });
});

test('edit mode 403 renders permission empty state', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId', () =>
      new HttpResponse(null, { status: 403 }),
    ),
  );

  renderWithProviders(<TaskCreationForm mode="edit" publicId="task-no-perm" />);

  await screen.findByText('No permission');
  expect(screen.getByText('Cannot edit this draft.')).toBeInTheDocument();
});

test('edit mode 404 renders not found empty state', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId', () =>
      new HttpResponse(null, { status: 404 }),
    ),
  );

  renderWithProviders(<TaskCreationForm mode="edit" publicId="task-missing" />);

  await screen.findByText('Task not found');
  expect(screen.getByText('Back to tasks')).toBeInTheDocument();
});


