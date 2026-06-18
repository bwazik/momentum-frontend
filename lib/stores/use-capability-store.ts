'use client';

import { create } from 'zustand';

interface CapabilityState {
  capabilities: string[];
  setCapabilities: (caps: string[]) => void;
  hasCapability: (cap: string) => boolean;
}

export const useCapabilityStore = create<CapabilityState>((set, get) => ({
  capabilities: [],
  setCapabilities: (caps: string[]) => set({ capabilities: caps }),
  hasCapability: (cap: string) => get().capabilities.includes(cap),
}));
