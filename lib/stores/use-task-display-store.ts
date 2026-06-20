import { create } from 'zustand';

interface TaskDisplayState {
  displayId: string;
  setDisplayId: (id: string) => void;
}

export const useTaskDisplayStore = create<TaskDisplayState>((set) => ({
  displayId: '',
  setDisplayId: (id: string) => set({ displayId: id }),
}));
