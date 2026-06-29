import { create } from 'zustand';

export type ManualAssignments = Record<string, string[]>;

interface TaskFormState {
  mode: 'create' | 'edit';
  publicId: string | null;
  blueprintId: string | null;
  blueprintName: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  priorityId: string | null;
  classificationLevel: 1 | 2 | 3;
  dueDate: string | null;
  manualAssignments: ManualAssignments;
  touched: boolean;
  initEdit: (publicId: string, data: {
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    priorityId: string | null;
    classificationLevel: 1 | 2 | 3;
    dueDate: string | null;
    blueprintId: string;
    blueprintName: string;
  }) => void;
  set: <K extends keyof TaskFormState>(k: K, v: TaskFormState[K]) => void;
  setManual: (key: string, user_ids: string[]) => void;
  reset: () => void;
}

const INITIAL = {
  mode: 'create' as const,
  publicId: null as string | null,
  blueprintId: null as string | null,
  blueprintName: '',
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  priorityId: null as string | null,
  classificationLevel: 1 as 1 | 2 | 3,
  dueDate: null as string | null,
  manualAssignments: {} as ManualAssignments,
  touched: false,
};

export const useTaskFormStore = create<TaskFormState>((set) => ({
  ...INITIAL,
  initEdit: (publicId, data) => set({ ...INITIAL, mode: 'edit', publicId, ...data }),
  set: (k, v) => set((s) => ({ ...s, [k]: v, touched: true })),
  setManual: (key, user_ids) => set((s) => ({
    ...s,
    manualAssignments: { ...s.manualAssignments, [key]: user_ids },
    touched: true,
  })),
  reset: () => set({ ...INITIAL }),
}));
