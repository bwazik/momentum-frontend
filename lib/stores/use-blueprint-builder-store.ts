import { create } from 'zustand';

interface BlueprintBuilderState {
  selectedStageId: string | null;
  panelOpen: boolean;
  metadataDirty: boolean;
  blueprintName: string;
  setSelectedStage: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setMetadataDirty: (dirty: boolean) => void;
  setBlueprintName: (name: string) => void;
  reset: () => void;
}

export const useBlueprintBuilderStore = create<BlueprintBuilderState>((set) => ({
  selectedStageId: null,
  panelOpen: false,
  metadataDirty: false,
  blueprintName: '',
  setSelectedStage: (id) => set({ selectedStageId: id }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setMetadataDirty: (dirty) => set({ metadataDirty: dirty }),
  setBlueprintName: (name) => set({ blueprintName: name }),
  reset: () => set({ selectedStageId: null, panelOpen: false, metadataDirty: false, blueprintName: '' }),
}));
