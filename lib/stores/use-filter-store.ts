import { create } from 'zustand';

interface FilterState {
  status: string | null;
  department: string | null;
  priority: string | null;
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'resetFilters'>, value: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  status: null,
  department: null,
  priority: null,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set({ status: null, department: null, priority: null }),
}));
