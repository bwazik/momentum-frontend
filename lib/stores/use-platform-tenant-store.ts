import { create } from 'zustand';

interface PlatformTenantDisplayState {
  tenantName: string;
  setTenantName: (name: string) => void;
}

export const usePlatformTenantDisplayStore = create<PlatformTenantDisplayState>((set) => ({
  tenantName: '',
  setTenantName: (name: string) => set({ tenantName: name }),
}));
