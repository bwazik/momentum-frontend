import { useCallback, useState } from 'react';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getTenantSlug } from '@/lib/utils/tenant';

function getLocaleSlug(): string {
  if (typeof document === 'undefined') return 'ar';
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return match ? match[1] : 'ar';
}

export const MAX_SIZE_MB = 20;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface PendingFileState {
  id: string;
  file: File;
  status: 'idle' | 'uploading' | 'error';
  description: string;
  error?: string;
}

export function usePendingUploads() {
  const [pendingUploads, setPendingUploads] = useState<PendingFileState[]>([]);

  const addPending = useCallback((file: File, error?: string) => {
    const id = `pending-${Date.now()}`;
    setPendingUploads((prev) => [
      { id, file, status: error ? 'error' : 'idle', description: '', error },
      ...prev,
    ]);
    return id;
  }, []);

  const updateDescription = useCallback((id: string, description: string) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, description } : p)),
    );
  }, []);

  const setUploading = useCallback((id: string) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'uploading' as const } : p)),
    );
  }, []);

  const setError = useCallback((id: string, error: string) => {
    setPendingUploads((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'error' as const, error } : p,
      ),
    );
  }, []);

  const removePending = useCallback((id: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setPendingUploads((prev) => prev.filter((p) => p.status !== 'uploading'));
  }, []);

  return {
    pendingUploads,
    addPending,
    updateDescription,
    setUploading,
    setError,
    removePending,
    clearCompleted,
  };
}

export async function fetchDocumentBlob(url: string): Promise<Blob> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'X-Tenant': getTenantSlug(),
      'X-Locale': getLocaleSlug(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch document');
  return response.blob();
}

export async function downloadDocument(downloadUrl: string, filename: string): Promise<void> {
  const blob = await fetchDocumentBlob(downloadUrl);
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export function formatFileSize(sizeBytes: string | number): string {
  const bytes = typeof sizeBytes === 'string' ? parseInt(sizeBytes, 10) : sizeBytes;
  if (Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_ICONS: Record<string, LucideIcon> = {
  Pdf: FileText,
  Image: FileImage,
  Excel: FileSpreadsheet,
  Word: FileType,
};

export function isPreviewable(mimeCategory: string): boolean {
  return mimeCategory === 'Pdf' || mimeCategory === 'Image';
}
