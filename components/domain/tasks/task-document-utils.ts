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
