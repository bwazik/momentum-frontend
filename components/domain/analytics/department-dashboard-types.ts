export interface DepartmentDashboardUrlFilters {
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  priorityId?: string;
  status?: string;
  slaHealth?: string;
  blueprintCategoryId?: string;
  assigneeId?: string;
}

export interface DepartmentPerformance {
  departmentPublicId: string;
  activeTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
  averageStageDelaySeconds: number;
}

export interface TeamMember {
  userPublicId: string;
  nameAr: string;
  nameEn: string;
  activeAssignments: number;
  overdueAssignments: number;
  completedStages: number;
}
