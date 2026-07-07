'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskDocumentItem } from './task-document-item';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentsListProps {
  documents: DocumentResource[];
  taskPublicId: string;
  onVersion: (document: DocumentResource) => void;
  onPreview: (document: DocumentResource) => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

export function TaskDocumentsList({
  documents,
  taskPublicId,
  onVersion,
  onPreview,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: TaskDocumentsListProps) {
  const t = useTranslations('tasks.documents');

  return (
    <div className="flex flex-col gap-3">
      <ol className="w-full min-w-0 space-y-3" aria-label={t('documents_list_label')}>
        {documents.map((document) => (
          <li key={document.public_id}>
            <TaskDocumentItem
              document={document}
              taskPublicId={taskPublicId}
              onVersion={() => onVersion(document)}
              onPreview={() => onPreview(document)}
            />
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </div>
  );
}
