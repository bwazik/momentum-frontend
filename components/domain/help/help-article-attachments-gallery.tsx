'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  ImageIcon,
  Download,
  Eye,
  Loader2,
  FileArchive,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchDocumentBlob } from '@/components/domain/tasks/task-document-utils';
import type { HelpArticleDocument } from '@/lib/api/types/help-center-types';

interface HelpArticleAttachmentsGalleryProps {
  documents: HelpArticleDocument[];
}

export function HelpArticleAttachmentsGallery({
  documents,
}: HelpArticleAttachmentsGalleryProps) {
  const t = useTranslations('help_center.attachments');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<HelpArticleDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  if (!documents || documents.length === 0) {
    return null;
  }

  const handleDownload = async (doc: HelpArticleDocument) => {
    try {
      setDownloadingId(doc.public_id);
      const blob = await fetchDocumentBlob(doc.download_url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('download_error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenPreview = async (doc: HelpArticleDocument) => {
    setPreviewDoc(doc);
    setLoadingPreview(true);
    try {
      const blob = await fetchDocumentBlob(doc.download_url || doc.preview_url || '');
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch {
      toast.error(t('download_error'));
      setPreviewDoc(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewDoc(null);
    setPreviewBlobUrl(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 pt-6 border-t" data-testid="help-attachments-gallery">
      <h3 className="text-base font-semibold tracking-tight">{t('title')}</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const isImage = doc.mime_type?.startsWith('image/');
          const isDownloading = downloadingId === doc.public_id;

          return (
            <div
              key={doc.public_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                  {isImage ? (
                    <ImageIcon className="size-5 text-primary" />
                  ) : doc.mime_type?.includes('zip') || doc.mime_type?.includes('tar') ? (
                    <FileArchive className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate" title={doc.original_name}>
                    {doc.original_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size_bytes ?? doc.file_size ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenPreview(doc)}
                    aria-label={`Preview ${doc.original_name}`}
                  >
                    <Eye className="size-4" />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  aria-label={`Download ${doc.original_name}`}
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && handleClosePreview()}>
          <DialogContent className="max-w-4xl p-4">
            <DialogHeader>
              <DialogTitle className="truncate pe-6">{previewDoc.original_name}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto rounded-lg bg-black/5 dark:bg-black/30 p-2">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              ) : previewBlobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBlobUrl}
                  alt={previewDoc.original_name}
                  className="max-h-[70vh] w-auto rounded object-contain shadow-sm"
                />
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(previewDoc)}
                disabled={downloadingId === previewDoc.public_id}
              >
                <Download className="me-2 size-4" />
                {t('download')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
