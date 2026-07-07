'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, File, Paperclip, Plus, RefreshCw, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useTaskDocuments,
  useUploadTaskDocument,
} from '@/lib/api/hooks/use-task-documents';
import { ApiRequestError } from '@/lib/api/client';
import { TaskDocumentsList } from './task-documents-list';
import { TaskDocumentsSkeleton } from './task-documents-skeleton';
import { TaskDocumentItem } from './task-document-item';
import { TaskDocumentVersionDialog } from './task-document-version-dialog';
import { TaskDocumentPreviewDialog } from './task-document-preview-dialog';
import type { DocumentResource } from './task-document-types';

const MAX_VISIBLE = 3;
const MAX_SIZE_MB = 20;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

interface PendingUpload {
  id: string;
  file: File;
  status: 'idle' | 'uploading' | 'error';
  description: string;
  error?: string;
}

interface TaskDocumentsCardProps {
  publicId: string;
}

export function TaskDocumentsCard({ publicId }: TaskDocumentsCardProps) {
  const t = useTranslations('tasks.documents');
  const locale = useLocale();
  const canManage = useCapability('task.manage_documents');
  const documentsQuery = useTaskDocuments(publicId);
  const uploadDocument = useUploadTaskDocument(publicId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentResource | null>(null);
  const [dialogMode, setDialogMode] = useState<'version' | 'preview' | null>(null);

  const allDocuments = useMemo(
    () => documentsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [documentsQuery.data],
  );

  const displayItems = useMemo(() => {
    const uploads = pendingUploads.map((p) => ({
      type: 'pending' as const,
      ...p,
    }));
    const docs = allDocuments.map((d) => ({ type: 'doc' as const, doc: d }));
    return [...uploads, ...docs];
  }, [pendingUploads, allDocuments]);

  const preview = useMemo(() => displayItems.slice(0, MAX_VISIBLE), [displayItems]);
  const totalCount = allDocuments.length;

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return t('error_disallowed_type');
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return t('error_too_large', { max: MAX_SIZE_MB });
    }
    return null;
  }

  function startPendingUpload(pending: PendingUpload) {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === pending.id ? { ...p, status: 'uploading' as const } : p)),
    );

    const formData = new FormData();
    formData.append('file', pending.file);
    if (pending.description.trim()) formData.append('description', pending.description.trim());

    uploadDocument.mutate(formData, {
      onSuccess: () => {
        setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
      },
      onError: (error) => {
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, status: 'error' as const, error: error instanceof ApiRequestError ? error.error.message : error.message }
              : p,
          ),
        );
      },
    });
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const id = `pending-${Date.now()}`;
    const validationError = validateFile(file);

    if (validationError) {
      setPendingUploads((prev) => [
        { id, file, status: 'error' as const, description: '', error: validationError },
        ...prev,
      ]);
      return;
    }

    setPendingUploads((prev) => [
      { id, file, status: 'idle', description: '' },
      ...prev,
    ]);
  }

  function retryUpload(pending: PendingUpload) {
    startPendingUpload({ ...pending, status: 'uploading' });
  }

  function removePending(id: string) {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePendingDescription(id: string, description: string) {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, description } : p)),
    );
  }

  function handleVersion(doc: DocumentResource) {
    setActiveDocument(doc);
    setDialogMode('version');
  }

  function handlePreview(doc: DocumentResource) {
    setActiveDocument(doc);
    setDialogMode('preview');
  }

  function renderPendingUpload(pending: PendingUpload) {
    return (
      <Attachment key={pending.id} state={pending.status === 'error' ? 'error' : pending.status === 'uploading' ? 'uploading' : 'idle'} className="w-full">
        <AttachmentMedia>
          <File className="size-5" aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent className="min-w-0">
          <AttachmentTitle className="truncate">{pending.file.name}</AttachmentTitle>
          <AttachmentDescription>
            {pending.status === 'uploading' && t('uploading')}
            {pending.status === 'error' && (pending.error ?? t('error'))}
            {pending.status === 'idle' && t('ready_to_upload')}
          </AttachmentDescription>
          {pending.status === 'idle' && (
            <div className="mt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pending.description}
                  onChange={(e) => updatePendingDescription(pending.id, e.target.value)}
                  placeholder={t('description_placeholder')}
                  className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                />
                <button
                  type="button"
                  onClick={() => startPendingUpload(pending)}
                  className="shrink-0 cursor-pointer rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t('upload')}
                </button>
              </div>
            </div>
          )}
        </AttachmentContent>
        <AttachmentActions>
          {pending.status === 'error' ? (
            <>
              <AttachmentAction
                size="icon-xs"
                aria-label={t('upload')}
                onClick={() => retryUpload(pending)}
              >
                <RefreshCw className="size-4" />
              </AttachmentAction>
              <AttachmentAction
                size="icon-xs"
                aria-label={t('cancel')}
                onClick={() => removePending(pending.id)}
              >
                <X className="size-4" />
              </AttachmentAction>
            </>
          ) : (
            <AttachmentAction
              size="icon-xs"
              aria-label={t('cancel')}
              onClick={() => removePending(pending.id)}
            >
              <X className="size-4" />
            </AttachmentAction>
          )}
        </AttachmentActions>
      </Attachment>
    );
  }

  if (documentsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskDocumentsSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (documentsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={t('error')} onRetry={() => documentsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
          {canManage && (
            <>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Plus className="me-1 size-4" />
                {t('upload')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleFileSelected}
              />
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {displayItems.length === 0 ? (
            <EmptyState
              icon={Paperclip}
              title={t('empty_title')}
              description={t('empty_description')}
              action={
                canManage ? (
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="me-1 size-4" />
                    {t('upload')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {preview.map((item) =>
                item.type === 'pending' ? (
                  renderPendingUpload(item)
                ) : (
                  <TaskDocumentItem
                    key={item.doc.public_id}
                    document={item.doc}
                    taskPublicId={publicId}
                    onVersion={() => handleVersion(item.doc)}
                    onPreview={() => handlePreview(item.doc)}
                  />
                ),
              )}
              {totalCount > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start"
                >
                  {t('view_all', { count: totalCount })} <ArrowRight className="inline size-3 rtl:rotate-180" />
                </button>
              )}
            </>
          )}
        </CardContent>

        <TaskDocumentVersionDialog
          document={activeDocument && dialogMode === 'version' ? activeDocument : null}
          taskPublicId={publicId}
          open={dialogMode === 'version'}
          onOpenChange={(open) => { if (!open) { setDialogMode(null); setActiveDocument(null); } }}
        />
        <TaskDocumentPreviewDialog
          document={activeDocument && dialogMode === 'preview' ? activeDocument : null}
          open={dialogMode === 'preview'}
          onOpenChange={(open) => { if (!open) { setDialogMode(null); setActiveDocument(null); } }}
        />
      </Card>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-2xl text-start">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <TaskDocumentsList
              documents={allDocuments}
              taskPublicId={publicId}
              onVersion={handleVersion}
              onPreview={handlePreview}
              fetchNextPage={documentsQuery.fetchNextPage}
              hasNextPage={documentsQuery.hasNextPage}
              isFetchingNextPage={documentsQuery.isFetchingNextPage}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
