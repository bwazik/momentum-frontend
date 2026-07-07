'use client';

import { createElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Download,
  Eye,
  File,
  History,
  Trash2,
} from 'lucide-react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName } from '@/lib/utils/localize';
import { timeFmtFromT, formatRelativeTime } from './task-detail-utils';
import { formatFileSize, isPreviewable, DOCUMENT_ICONS, downloadDocument } from './task-document-utils';
import { TaskDocumentDeleteDialog } from './task-document-delete-dialog';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentItemProps {
  document: DocumentResource;
  taskPublicId: string;
  onVersion: () => void;
  onPreview: () => void;
}

export function TaskDocumentItem({
  document,
  taskPublicId,
  onVersion,
  onPreview,
}: TaskDocumentItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.documents');
  const timeT = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(timeT);
  const canManage = useCapability('task.manage_documents');
  const uploaderName = localizeName(locale, document.uploader.name_ar, document.uploader.name_en);
  const relativeTime = formatRelativeTime(document.created_at, timeFmt);
  const shortDesc = `${formatFileSize(document.size_bytes)} · ${uploaderName} · ${relativeTime}`;
  const fullDesc = `${document.mime_category} · ${formatFileSize(document.size_bytes)} · ${uploaderName} · ${relativeTime}`;

  return (
    <Attachment className="w-full">
      <AttachmentMedia>
        {createElement(DOCUMENT_ICONS[document.mime_category] ?? File, {
          className: 'size-5',
          'aria-hidden': true,
        })}
      </AttachmentMedia>
      <AttachmentContent className="min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <AttachmentTitle className="truncate">{document.original_filename}</AttachmentTitle>
                <AttachmentDescription>{shortDesc}</AttachmentDescription>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{document.original_filename}</p>
                <p className="text-xs text-muted-foreground">{fullDesc}</p>
                {document.description && (
                  <p className="text-xs text-muted-foreground/80">{document.description}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          size="icon-xs"
          aria-label={t('download_document', { name: document.original_filename })}
          onClick={() => downloadDocument(document.download_url, document.original_filename)}
        >
          <Download className="size-4" />
        </AttachmentAction>
        {document.preview_url && isPreviewable(document.mime_category) && (
          <AttachmentAction
            size="icon-xs"
            aria-label={t('preview_document', { name: document.original_filename })}
            onClick={onPreview}
          >
            <Eye className="size-4" />
          </AttachmentAction>
        )}
        {canManage && (
          <>
            <AttachmentAction
              size="icon-xs"
              aria-label={t('view_versions', { name: document.original_filename })}
              onClick={onVersion}
            >
              <History className="size-4" />
            </AttachmentAction>
            <TaskDocumentDeleteDialog
              document={document}
              taskPublicId={taskPublicId}
              trigger={
                <AttachmentAction
                  size="icon-xs"
                  aria-label={t('delete_document', { name: document.original_filename })}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </AttachmentAction>
              }
            />
          </>
        )}
      </AttachmentActions>
    </Attachment>
  );
}
