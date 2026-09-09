export interface HelpArticleCategory {
  public_id: string;
  slug?: string | null;
  name_ar: string;
  name_en: string;
  display_order: number;
  is_active: boolean;
  article_count?: number;
  created_at?: string;
}

export interface HelpArticleAuthor {
  public_id: string;
  name_ar: string;
  name_en: string;
}

export interface HelpArticle {
  public_id: string;
  slug?: string | null;
  title_ar: string;
  title_en: string;
  category?: {
    public_id: string;
    slug?: string | null;
    name_ar: string;
    name_en: string;
  };
  is_published: boolean;
  display_order: number;
  view_count: number;
  author?: HelpArticleAuthor;
  published_at?: string | null;
  estimated_read_time?: number;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface HelpArticleDetail extends HelpArticle {
  body_ar: string;
  body_en?: string | null;
  last_editor?: HelpArticleAuthor;
}

export interface HelpArticleSearchResult extends HelpArticle {
  relevance_score?: number;
  snippet?: string;
}

export interface HelpArticleDocument {
  public_id: string;
  original_name: string;
  file_size: number;
  size_bytes?: number;
  mime_type: string;
  download_url: string;
  preview_url?: string | null;
  created_at: string;
}

export interface HelpArticleFilters {
  category_id?: string | null;
  is_published?: boolean | null;
  per_page?: number;
}

export interface HelpArticleSearchFilters {
  q: string;
  category_id?: string | null;
  per_page?: number;
}

export interface StoreHelpArticleRequest {
  category_id: string;
  title_ar: string;
  title_en?: string;
  body_ar: string;
  body_en?: string;
  display_order?: number;
}

export interface UpdateHelpArticleRequest {
  category_id?: string;
  title_ar?: string;
  title_en?: string;
  body_ar?: string;
  body_en?: string;
  display_order?: number;
}

export interface StoreHelpCategoryRequest {
  name_ar: string;
  name_en: string;
  display_order?: number;
}

export interface UpdateHelpCategoryRequest {
  name_ar?: string;
  name_en?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ReorderHelpCategoriesRequest {
  categories: Array<{
    public_id: string;
    display_order: number;
  }>;
}
