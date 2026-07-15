import type { operations } from '@/lib/generated/api-types';

export type AgingReportQuery = NonNullable<
  operations['agingReport.index']['parameters']['query']
>;

export interface AgingReportUrlFilters {
  status?: 'active' | 'suspended' | 'all';
  priorityId?: string;
  departmentId?: string;
  blueprintCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  calendarSystem?: 'gregorian' | 'hijri';
}

export interface AgingAssignee {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
}

export interface AgingPriority {
  public_id: string;
  name_ar: string;
  name_en: string;
  severity_rank: string;
  color_code?: string | null;
}

export interface AgingReportItem {
  task_public_id: string;
  title_ar: string;
  title_en: string;
  priority: AgingPriority | null;
  current_stage_name_ar: string | null;
  current_stage_name_en: string | null;
  active_assignees: AgingAssignee[];
  sla_health: 'green' | 'amber' | 'red' | 'grey' | 'none';
  created_at: string | null;
  entered_at: string | null;
}
