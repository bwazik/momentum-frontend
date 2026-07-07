'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { ApiRequestError } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { formatFileSize } from './task-document-utils';
import type { UseMutationResult } from '@tanstack/react-query';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadMutation: UseMutationResult<DocumentResource, Error, FormData, unknown>;
}

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

export function TaskDocumentUploadDialog({
  open,
  onOpenChange,
  uploadMutation,
}: TaskDocumentUploadDialogProps) {
  const t = useTranslations('tasks.documents');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setDescription('');
    setClientError(null);
  }

  function validate(selected: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      return t('error_disallowed_type');
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      return t('error_too_large', { max: MAX_SIZE_MB });
    }
    return null;
  }

  function handleFile(selected: File | null) {
    setClientError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const error = validate(selected);
    if (error) {
      setClientError(error);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleSubmit() {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (description.trim()) formData.append('description', description.trim());

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  const error422 =
    uploadMutation.error instanceof ApiRequestError && uploadMutation.error.status === 422
      ? uploadMutation.error.error.message
      : null;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="sm:max-w-md text-start">
        <DialogHeader>
          <DialogTitle>{t('upload_dialog_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-colors',
              dragOver && 'border-primary bg-primary/5',
              !dragOver && 'border-border bg-muted/50',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              handleFile(dropped);
            }}
            role="button"
            tabIndex={0}
            aria-label={t('dropzone_label')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('dropzone_text')}</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(',')}
              aria-describedby={clientError || error422 ? 'doc-upload-error' : undefined}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {t('choose_file')}
            </Button>
          </div>

          {file && (
            <p className="text-sm text-foreground">
              {t('selected_file')}: <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})
            </p>
          )}

          <Field>
            <FieldLabel htmlFor="doc-description">{t('description_optional')}</FieldLabel>
            <Textarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description_placeholder')}
              rows={3}
            />
          </Field>

          {(clientError || error422) && (
            <p id="doc-upload-error" className="text-sm text-destructive" role="alert">
              {clientError ?? error422}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? t('uploading') : t('upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
