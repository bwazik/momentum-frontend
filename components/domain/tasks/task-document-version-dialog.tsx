'use client';

import { useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { File, Plus, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useDocumentVersions, useUploadDocumentVersion } from '@/lib/api/hooks/use-task-documents';
import { localizeName } from '@/lib/utils/localize';
import { timeFmtFromT, formatRelativeTime } from './task-detail-utils';
import { formatFileSize, ALLOWED_MIME_TYPES, usePendingUploads, type PendingFileState } from './task-document-utils';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentVersionDialogProps {
  document: DocumentResource | null;
  taskPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDocumentVersionDialog({
  document,
  taskPublicId,
  open,
  onOpenChange,
}: TaskDocumentVersionDialogProps) {
  const t = useTranslations('tasks.documents');
  const timeT = useTranslations('tasks.detail');
  const locale = useLocale();
  const timeFmt = timeFmtFromT(timeT);
  const canManage = useCapability('task.manage_documents');
  const versionsQuery = useDocumentVersions(document?.public_id ?? '');
  const uploadVersion = useUploadDocumentVersion(document?.public_id ?? '', taskPublicId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingUploads, addPending, updateDescription, setUploading, setError, removePending } = usePendingUploads();

  const allVersions = useMemo(
    () => versionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [versionsQuery.data],
  );

  const latestVersionNumber = useMemo(() => {
    return allVersions.reduce((max, v) => Math.max(max, parseInt(v.version_number, 10) || 0), 0);
  }, [allVersions]);

  function startUpload(pending: PendingFileState) {
    setUploading(pending.id);

    const formData = new FormData();
    formData.append('file', pending.file);
    if (pending.description.trim()) formData.append('description', pending.description.trim());

    uploadVersion.mutate(formData, {
      onSuccess: () => {
        removePending(pending.id);
      },
      onError: (error) => {
        setError(pending.id, error instanceof Error ? error.message : t('error'));
      },
    });
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      addPending(file, t('error_disallowed_type'));
      return;
    }

    addPending(file);
  }

  function retryPending(pending: PendingFileState) {
    startUpload(pending);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl text-start">
        <DialogHeader>
          <DialogTitle>{t('versions_title', { name: document?.original_filename ?? '' })}</DialogTitle>
        </DialogHeader>
        {canManage && (
          <div className="mb-3">
            <Button size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Plus className="me-1 size-4" />
              {t('upload_new_version')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileSelected}
            />
          </div>
        )}
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {pendingUploads.map((p) => (
              <Attachment key={p.id} state={p.status === 'error' ? 'error' : p.status === 'uploading' ? 'uploading' : 'idle'} className="w-full">
                <AttachmentMedia>
                  <File className="size-5" aria-hidden="true" />
                </AttachmentMedia>
                <AttachmentContent className="min-w-0">
                  <AttachmentTitle className="truncate">{p.file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {p.status === 'uploading' && t('uploading')}
                    {p.status === 'error' && (p.error ?? t('error'))}
                    {p.status === 'idle' && t('ready_to_upload')}
                  </AttachmentDescription>
                  {p.status === 'idle' && (
                    <div className="mt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) => updateDescription(p.id, e.target.value)}
                          placeholder={t('description_placeholder')}
                          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                        />
                        <button
                          type="button"
                          onClick={() => startUpload(p)}
                          className="shrink-0 cursor-pointer rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          {t('upload')}
                        </button>
                      </div>
                    </div>
                  )}
                </AttachmentContent>
                <AttachmentActions>
                  {p.status === 'error' ? (
                    <>
                      <AttachmentAction size="icon-xs" aria-label={t('upload')} onClick={() => retryPending(p)}>
                        <RefreshCw className="size-4" />
                      </AttachmentAction>
                      <AttachmentAction size="icon-xs" aria-label={t('cancel')} onClick={() => removePending(p.id)}>
                        <X className="size-4" />
                      </AttachmentAction>
                    </>
                  ) : (
                    <AttachmentAction size="icon-xs" aria-label={t('cancel')} onClick={() => removePending(p.id)}>
                      <X className="size-4" />
                    </AttachmentAction>
                  )}
                </AttachmentActions>
              </Attachment>
            ))}
            {versionsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <Skeleton className="mb-2 h-4 w-1/4" />
                  <Skeleton className="mb-1 h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : versionsQuery.isError ? (
              <ErrorState message={t('error')} onRetry={() => versionsQuery.refetch()} />
            ) : allVersions.length === 0 && pendingUploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <AlertCircle className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{t('empty_title')}</p>
              </div>
            ) : (
              <>
                <ol className="space-y-2" aria-label={t('versions_list_label')}>
                  {allVersions.map((version) => {
                    const isLatest = parseInt(version.version_number, 10) === latestVersionNumber;
                    const uploader = localizeName(locale, version.uploader.name_ar, version.uploader.name_en);
                    return (
                      <li
                        key={version.public_id}
                        aria-label={`${t('version_n', { n: version.version_number })}: ${version.original_filename}`}
                        className={cn(
                          'rounded-lg border p-3',
                          isLatest ? 'border-primary bg-primary/5' : 'border-border',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {t('version_n', { n: version.version_number })}
                          </span>
                          {isLatest && (
                            <span className="text-xs font-medium text-primary">{t('latest')}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{version.original_filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(version.size_bytes)} · {uploader} · {version.created_at ? formatRelativeTime(version.created_at, timeFmt) : ''}
                        </p>
                      </li>
                    );
                  })}
                </ol>
                {versionsQuery.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => versionsQuery.fetchNextPage()}
                    disabled={versionsQuery.isFetchingNextPage}
                    className="mt-3 w-full"
                  >
                    {versionsQuery.isFetchingNextPage ? t('loading_more') : t('load_more')}
                  </Button>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
