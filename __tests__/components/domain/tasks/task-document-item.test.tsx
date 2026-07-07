import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import { TaskDocumentItem } from '@/components/domain/tasks/task-document-item';
import type { DocumentResource } from '@/components/domain/tasks/task-document-types';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, Record<string, string | ((p: Record<string, unknown>) => string)>> = {
      'tasks.documents': {
        download_document: (p: Record<string, unknown>) => `Download ${p.name}`,
        preview_document: (p: Record<string, unknown>) => `Preview ${p.name}`,
        view_versions: (p: Record<string, unknown>) => `Versions of ${p.name}`,
        delete_document: (p: Record<string, unknown>) => `Delete ${p.name}`,
        delete_title: 'Delete Attachment',
        delete_description: (p: Record<string, unknown>) => `Are you sure you want to delete ${p.name}? This action cannot be undone.`,
        delete: 'Delete',
        cancel: 'Cancel',
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

const baseDocument: DocumentResource = {
  public_id: 'doc-1',
  original_filename: 'report.pdf',
  mime_type: 'application/pdf',
  mime_category: 'Pdf',
  size_bytes: '1024000',
  version_number: '1',
  description: '',
  uploader: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmed' },
  download_url: 'https://api.momentum.test/v1/documents/doc-1/download',
  preview_url: 'https://api.momentum.test/v1/documents/doc-1/preview',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
};

test('renders filename and compact description', () => {
  renderWithProviders(
    <TaskDocumentItem
      document={baseDocument}
      taskPublicId="task-uuid-1"
      onVersion={vi.fn()}
      onPreview={vi.fn()}
    />,
  );

  expect(screen.getByText('report.pdf')).toBeInTheDocument();
  expect(screen.getByText(/1000\.0 KB/)).toBeInTheDocument();
});

test('renders download action always', () => {
  renderWithProviders(
    <TaskDocumentItem
      document={baseDocument}
      taskPublicId="task-uuid-1"
      onVersion={vi.fn()}
      onPreview={vi.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: /Download.*report\.pdf/ })).toBeInTheDocument();
});

test('renders preview action when preview_url is present and previewable', () => {
  renderWithProviders(
    <TaskDocumentItem
      document={baseDocument}
      taskPublicId="task-uuid-1"
      onVersion={vi.fn()}
      onPreview={vi.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: /Preview.*report\.pdf/ })).toBeInTheDocument();
});

test('hides preview action when preview_url is null', () => {
  const docWithoutPreview = { ...baseDocument, preview_url: null };
  renderWithProviders(
    <TaskDocumentItem
      document={docWithoutPreview}
      taskPublicId="task-uuid-1"
      onVersion={vi.fn()}
      onPreview={vi.fn()}
    />,
  );

  expect(screen.queryByRole('button', { name: /Preview.*report\.pdf/ })).not.toBeInTheDocument();
});
