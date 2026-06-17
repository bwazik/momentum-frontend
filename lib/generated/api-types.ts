// Auto-generated from ../backend/openapi/openapi.json. Do not edit.
// Run: npm run generate:api

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface Task {
  public_id: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  status?: string;
  sla_health?: string;
  assignee_name?: string;
  blueprint_name?: string;
  stage_name?: string;
}

export type SlaHealth = 'green' | 'amber' | 'red' | 'grey';
