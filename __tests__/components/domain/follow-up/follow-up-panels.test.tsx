import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { BottleneckPanel } from '@/components/domain/follow-up/bottleneck-panel';
import { EscalationsPanel } from '@/components/domain/follow-up/escalations-panel';
import { RecentActionsPanel } from '@/components/domain/follow-up/recent-actions-panel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/follow-up',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'followUp.bottlenecks': {
        'title': 'Stage Bottlenecks by Department',
        'overdue': 'overdue',
        'at_risk': 'at risk',
        'empty_title': 'No bottlenecks',
        'empty_description': 'No stage-level bottlenecks detected.',
        'error_title': 'Unable to load bottlenecks',
      },
      'followUp.escalations': {
        'title': 'Escalations',
        'tab_open': 'Open',
        'tab_resolved': 'Resolved',
        'empty_title_open': 'No open escalations',
        'empty_description_open': 'All escalations are resolved.',
        'empty_title_resolved': 'No resolved escalations',
        'empty_description_resolved': 'No escalations have been resolved yet.',
        'error_title': 'Unable to load escalations',
        'resolve': 'Resolve',
        'resolve_title': 'Resolve Escalation',
        'resolution_note': 'Resolution note',
        'resolution_required': 'Resolution note is required',
        'resolved': 'Escalation resolved',
        'resolve_error': 'Failed to resolve escalation',
        'escalated_to': 'Escalated to',
        'cancel': 'Cancel',
        'submitting': 'Submitting...',
        'load_more': 'Load more',
        'view_all': 'View all ({count})',
        'event_auto': 'Auto escalation — {task}',
        'event_auto_to': 'Notified: {to}',
        'event_manual': 'Manual escalation — {task}',
        'event_manual_to': 'Escalated to: {to}',
      },
      'followUp.recent_actions': {
        'title': 'Recent Follow-Up Actions',
        'empty_title': 'No recent actions',
        'empty_description': 'Log a follow-up action from a task row.',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

vi.mock('@/lib/api/hooks/use-capabilities', () => ({
  useCapability: (cap: string) => {
    if (cap === 'task.view.organization') return true;
    if (cap === 'task.view.follow_up_scope') return true;
    return false;
  },
}));

vi.mock('@/lib/api/hooks/use-auth', () => ({
  useCurrentUser: () => ({ data: { public_id: 'u-1' } }),
}));

describe('BottleneckPanel', () => {
  it('renders panel title', () => {
    renderWithProviders(<BottleneckPanel />);
    expect(screen.getByText('Stage Bottlenecks by Department')).toBeInTheDocument();
  });
});

describe('EscalationsPanel', () => {
  it('renders panel title', () => {
    renderWithProviders(<EscalationsPanel onResolve={vi.fn()} />);
    expect(screen.getByText('Escalations')).toBeInTheDocument();
  });
});

describe('RecentActionsPanel', () => {
  it('renders empty state when no tasks', async () => {
    renderWithProviders(<RecentActionsPanel />);
    expect(await screen.findByText('No recent actions')).toBeInTheDocument();
  });
});
