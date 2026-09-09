import { create } from 'zustand';

interface HelpDisplayState {
  articleTitle: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  setArticleDisplay: (title: string | null, categoryName?: string | null, categorySlug?: string | null) => void;
  clearArticleDisplay: () => void;
}

export const useHelpDisplayStore = create<HelpDisplayState>((set) => ({
  articleTitle: null,
  categoryName: null,
  categorySlug: null,
  setArticleDisplay: (title, categoryName = null, categorySlug = null) =>
    set({ articleTitle: title, categoryName, categorySlug }),
  clearArticleDisplay: () =>
    set({ articleTitle: null, categoryName: null, categorySlug: null }),
}));
