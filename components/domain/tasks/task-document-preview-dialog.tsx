'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isPreviewable, fetchDocumentBlob } from './task-document-utils';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentPreviewDialogProps {
  document: DocumentResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDocumentPreviewDialog({
  document,
  open,
  onOpenChange,
}: TaskDocumentPreviewDialogProps) {
  const t = useTranslations('tasks.documents');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const canPreview = !!(document?.preview_url && isPreviewable(document.mime_category));
  const isLoading = open && canPreview && !blobUrl && !loadError;

  useEffect(() => {
    if (!open || !canPreview) return;

    let cancelled = false;

    fetchDocumentBlob(document.preview_url!)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, canPreview, document?.preview_url]);

  return (
    <Dialog key={document?.public_id ?? 'no-doc'} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>{document?.original_filename}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" aria-label={t('loading_more')} />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <AlertCircle className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('error')}</p>
          </div>
        ) : blobUrl && document ? (
          document.mime_category === 'Image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={document.original_filename}
              className="max-h-[65vh] w-full object-contain"
            />
          ) : (
            <iframe
              src={blobUrl}
              title={document.original_filename}
              className="h-[65vh] w-full rounded-md border"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <AlertCircle className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('preview_unavailable')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
