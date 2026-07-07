import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../../utils/test-utils';
import { server } from '../../../mocks/server';
import { TaskDocumentsCard } from '@/components/domain/tasks/task-documents-card';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/test-uuid',
}));

let mockLocale = 'en';
vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, Record<string, string | ((p: Record<string, unknown>) => string)>> = {
      shared: {
        error: 'An error occurred.',
        retry: 'Try again',
      },
      'tasks.documents': {
        title: mockLocale === 'ar' ? 'المرفقات' : 'Attachments',
        upload: mockLocale === 'ar' ? 'رفع' : 'Upload',
        uploading: mockLocale === 'ar' ? 'جاري الرفع...' : 'Uploading...',
        ready_to_upload: 'Ready to upload',
        description_placeholder: mockLocale === 'ar' ? 'أضف وصفاً قصيراً...' : 'Add a short description...',
        empty_title: mockLocale === 'ar' ? 'لا توجد مرفقات بعد' : 'No attachments yet',
        empty_description: mockLocale === 'ar' ? 'قم برفع المستندات والصور المتعلقة بالمهمة هنا.' : 'Upload task-related documents and images here.',
        error: 'Unable to load attachments.',
        load_more: 'Load more',
        loading_more: 'Loading...',
        documents_list_label: 'Attachments',
        download_document: (p: Record<string, unknown>) => `Download ${p.name}`,
        preview_document: (p: Record<string, unknown>) => `Preview ${p.name}`,
        view_versions: (p: Record<string, unknown>) => `Versions of ${p.name}`,
        delete_document: (p: Record<string, unknown>) => `Delete ${p.name}`,
        delete_title: 'Delete Attachment',
        delete_description: (p: Record<string, unknown>) => `Are you sure you want to delete ${p.name}? This action cannot be undone.`,
        delete: 'Delete',
        deleting: 'Deleting...',
        cancel: 'Cancel',
        versions_title: (p: Record<string, unknown>) => `Versions of ${p.name}`,
        versions_list_label: 'Version list',
        upload_new_version: 'Upload New Version',
        version_n: (p: Record<string, unknown>) => `Version ${p.n}`,
        latest: 'Latest',
        preview_unavailable: 'This file type cannot be previewed.',
        error_too_large: (p: Record<string, unknown>) => `File size exceeds ${p.max} MB.`,
        error_disallowed_type: 'File type not allowed. Only PDF, images, Word, and Excel files are permitted.',
        toast_uploaded: 'Attachment uploaded',
        toast_version_created: 'New version created',
        toast_deleted: 'Attachment deleted',
      },
      'tasks.detail': {
        time_just_now: 'Just now',
        time_less_than_1h: 'Less than 1 hour',
        time_minute_one: 'minute',
        time_minute_many: 'minutes',
        time_hour_one: 'hour',
        time_hour_many: 'hours',
        time_day_one: 'day',
        time_day_two: 'two days',
        time_day_many: 'days',
        time_ago_prefix: '',
        time_ago_suffix: ' ago',
        time_overdue_prefix: 'Overdue by ',
        time_at_risk: 'At risk',
        time_remaining: ' remaining',
        time_due_today: 'Due today',
        time_paused: 'Paused',
        time_completed: 'Completed',
      },
    };
    const ns = translations[namespace];
    if (!ns) return key;
    const value = ns[key];
    if (typeof value === 'function') return value(params ?? {});
    return value ?? key;
  },
}));

afterEach(() => {
  server.resetHandlers();
  useCapabilityStore.getState().setCapabilities([]);
});

test('renders loading skeleton', () => {
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);
  expect(screen.getByTestId('task-documents-skeleton')).toBeInTheDocument();
});

test('renders documents list on success', async () => {
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('report.pdf');
  expect(screen.getByText('1000.0 KB · Ahmed · 2 hours ago')).toBeInTheDocument();
});

test('shows empty state when no documents', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
      return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
    }),
  );

  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('No attachments yet');
});

test('shows error state on API failure', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('Unable to load attachments.');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

test('shows idle state then uploading after clicking send', async () => {
  useCapabilityStore.getState().setCapabilities(['task.manage_documents']);
  const user = userEvent.setup();
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('report.pdf');

  const fileInput = document.body.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
  await user.upload(fileInput, file);

  expect(await screen.findByText('Ready to upload')).toBeInTheDocument();

  const uploadBtns = screen.getAllByRole('button', { name: 'Upload' });
  await user.click(uploadBtns[1]);

  expect(await screen.findByText('Uploading...')).toBeInTheDocument();
});

test('shows error state inline when upload fails with 422', async () => {
  useCapabilityStore.getState().setCapabilities(['task.manage_documents']);
  server.use(
    http.post('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
      return HttpResponse.json(
        { message: 'File type not allowed.' },
        { status: 422 },
      );
    }),
  );

  const user = userEvent.setup();
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('report.pdf');

  const fileInput = document.body.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
  await user.upload(fileInput, file);

  const uploadBtns = screen.getAllByRole('button', { name: 'Upload' });
  await user.click(uploadBtns[1]);

  expect(await screen.findByText('File type not allowed.')).toBeInTheDocument();
});

test('shows delete dialog and confirms deletion', async () => {
  useCapabilityStore.getState().setCapabilities(['task.manage_documents']);
  let deleted = false;
  server.use(
    http.delete('https://api.momentum.test/v1/documents/:documentId', () => {
      deleted = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('report.pdf');

  const deleteBtn = screen.getByRole('button', { name: /Delete.*report\.pdf/ });
  await user.click(deleteBtn);

  await screen.findByText('Delete Attachment');

  const confirmBtn = screen.getByRole('button', { name: 'Delete' });
  await user.click(confirmBtn);

  await waitFor(() => {
    expect(deleted).toBe(true);
  });
});

test('opens version dialog and shows version list', async () => {
  useCapabilityStore.getState().setCapabilities(['task.manage_documents']);
  const user = userEvent.setup();
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('report.pdf');

  const versionBtn = screen.getByRole('button', { name: /Versions.*report\.pdf/ });
  await user.click(versionBtn);

  expect(screen.getByText(/Versions of report.pdf/)).toBeInTheDocument();
});

test('renders correctly in Arabic RTL', async () => {
  mockLocale = 'ar';

  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
      return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
    }),
  );

  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);

  await screen.findByText('لا توجد مرفقات بعد');

  mockLocale = 'en';
});
