import { screen } from '@testing-library/react';
import { WorkflowNode } from '@/components/domain/tasks/workflow-node';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import type { WorkflowNodeModel, WorkflowNodeStatus } from '@/components/domain/tasks/workflow-types';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translationsByNamespace: Record<string, Record<string, string>> = {
      'tasks.workflow': {
        status_completed: 'Completed',
        status_active: 'Active',
        status_pending: 'Pending',
        stage_n: 'Stage {n}',
        stage_node_label: 'Stage {name} — {status}',
        sla_no_policy: 'No SLA policy',
        sla: 'SLA',
      },
      'tasks.detail': {
        time_less_than_1h: 'Less than 1 hour',
        time_just_now: 'Just now',
        time_ago_prefix: '',
        time_ago_suffix: ' ago',
        time_overdue_prefix: 'Overdue by ',
        time_at_risk: 'At risk',
        time_remaining: ' remaining',
        time_due_today: 'Due today',
        time_paused: 'Paused',
        time_completed: 'Completed',
        time_day_one: 'day',
        time_day_many: 'days',
        time_hour_one: 'hour',
        time_hour_many: 'hours',
        time_minute_one: 'minute',
        time_minute_many: 'minutes',
      },
      'blueprints.builder.canvas': {
        sla_unit_hours: 'hours',
        sla_unit_days: 'days',
      },
    };
    return translationsByNamespace[namespace]?.[key] ?? key;
  },
}));

function buildNodeMock(status: WorkflowNodeStatus, nameEn = 'Director Assignment'): WorkflowNodeModel {
  return {
    blueprintStage: {
      public_id: 'stage-1',
      name_ar: 'تعيين المدير',
      name_en: nameEn,
      sequence_order: '1',
      stage_type: { public_id: 'type-1', name_ar: 'مراجعة', name_en: 'Review' },
      sla_policy: null,
    } as unknown as WorkflowNodeModel['blueprintStage'],
    instance: status === 'pending'
      ? undefined
      : {
          instance_id: 'inst-1',
          blueprint_stage: { public_id: 'stage-1', name_ar: 'تعيين المدير', name_en: nameEn, stage_type: null },
          status,
          entered_at: '2026-06-20T08:00:00Z',
          exited_at: status === 'completed' ? '2026-06-20T11:00:00Z' : null,
          assignments: [],
          sub_stages: [],
        } as unknown as NonNullable<WorkflowNodeModel['instance']>,
    status,
    sequenceOrder: 1,
    isActive: status === 'active',
    isTerminal: status === 'completed',
  };
}

test('completed node shows localized name and status', () => {
  const node = buildNodeMock('completed');
  renderWithProviders(<WorkflowNode node={node} taskPublicId="task-1" />);
  expect(screen.getByText('Director Assignment')).toBeInTheDocument();
  expect(screen.getByText('Completed')).toBeInTheDocument();
});

test('active node shows pulse indicator', () => {
  const node = buildNodeMock('active');
  renderWithProviders(<WorkflowNode node={node} taskPublicId="task-1" />);
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
});
