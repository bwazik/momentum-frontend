'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { EXTERNAL_REFERENCE_TYPE_ICONS, useReferenceTypeLabel } from './task-external-reference-utils';
import { localizeName } from '@/lib/utils/localize';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferenceItemProps {
  reference: TaskExternalReferenceResource;
  canManage: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function TaskExternalReferenceItem({ reference, canManage, onEdit, onDelete }: TaskExternalReferenceItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  const typeLabel = useReferenceTypeLabel(reference.reference_type);
  const entityName = reference.external_entity
    ? localizeName(locale, reference.external_entity.name_ar, reference.external_entity.name_en)
    : null;
  const ReferenceIcon = EXTERNAL_REFERENCE_TYPE_ICONS[reference.reference_type] ?? EXTERNAL_REFERENCE_TYPE_ICONS.other;

  const descParts = [typeLabel, entityName].filter(Boolean);
  const desc = descParts.join(' — ');

  return (
    <Attachment className="w-full">
      <AttachmentMedia>
        <ReferenceIcon className="size-5" aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent className="min-w-0">
        <AttachmentTitle className="truncate">{reference.reference_number}</AttachmentTitle>
        <AttachmentDescription>
          {desc}
          {reference.notes && (
            <span className="block text-xs text-muted-foreground/70 truncate">{reference.notes}</span>
          )}
        </AttachmentDescription>
      </AttachmentContent>
      {canManage && (
        <AttachmentActions>
          <AttachmentAction
            size="icon-xs"
            aria-label={t('edit_reference', { number: reference.reference_number })}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </AttachmentAction>
          <AttachmentAction
            size="icon-xs"
            className="text-destructive hover:bg-destructive/10"
            aria-label={t('delete_reference', { number: reference.reference_number })}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </AttachmentAction>
        </AttachmentActions>
      )}
    </Attachment>
  );
}
