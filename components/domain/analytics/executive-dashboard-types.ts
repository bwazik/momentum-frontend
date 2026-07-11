export interface ExecutiveDashboardUrlFilters {
  dateFrom?: string;
  dateTo?: string;
  priorityId?: string;
  departmentId?: string;
  blueprintCategoryId?: string;
}

export interface ExecutiveSummary {
  active: number;
  overdue: number;
  atRisk: number;
  suspended: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export type DepartmentHealthKey = 'green' | 'amber' | 'red';

export interface DepartmentHealthItem {
  departmentPublicId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  health: DepartmentHealthKey;
  healthLabel: string;
  activeTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
}

export interface BottleneckItem {
  stageTypePublicId: string;
  stageTypeNameAr: string;
  stageTypeNameEn: string;
  departmentPublicId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  overdueCount: number;
  atRiskCount: number;
  score: number;
  averageTimeAtStageSeconds: number;
}

export type SlaHealthKey = 'green' | 'amber' | 'red' | 'grey' | 'none';
export type DrillDownTaskPriority = {
  public_id: string;
  name_ar: string;
  name_en: string;
  severity_rank: string;
  color_code: string;
} | null;

export interface DrillDownTaskItem {
  taskPublicId: string;
  displayId: string;
  titleAr: string;
  titleEn: string;
  status: string;
  priority: DrillDownTaskPriority;
  currentStageNameAr: string;
  currentStageNameEn: string;
  owningDepartmentPublicId: string;
  slaHealth: SlaHealthKey;
  createdAt: string;
}
