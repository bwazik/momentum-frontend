export interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}
