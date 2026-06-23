'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOverrideAssignment } from '@/lib/api/hooks/use-task-detail';
import { UserSearchCombobox } from './user-search-combobox';
import { localizeName } from './task-detail-utils';
import type { TaskStageAssignmentResource } from './task-detail-types';

interface OverrideAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskPublicId: string;
  stageInstancePublicId: string;
  currentAssignees: TaskStageAssignmentResource[];
  detailPublicId: string;
  isSubStage: boolean;
}

export function OverrideAssignmentDialog({
  open,
  onOpenChange,
  taskPublicId,
  stageInstancePublicId,
  currentAssignees,
  detailPublicId,
  isSubStage,
}: OverrideAssignmentDialogProps) {
  const t = useTranslations('tasks.detail');
  const locale = useLocale();
  const overrideMut = useOverrideAssignment(detailPublicId, isSubStage);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [reason, setReason] = useState('');

  function handleSubmit() {
    if (!selectedAssigneeId || !newUserId || !reason) return;
    overrideMut.mutate(
      {
        taskPublicId,
        instancePublicId: stageInstancePublicId,
        body: {
          assignments: [{ current_user_id: selectedAssigneeId, new_user_id: newUserId }],
          reason,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedAssigneeId('');
          setNewUserId('');
          setReason('');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('override_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t('current_assignee')}</Label>
            <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('select_assignee')} />
              </SelectTrigger>
              <SelectContent position="popper">
                {currentAssignees.map((a) => (
                  <SelectItem key={a.user_id} value={a.user_id}>
                    {localizeName(locale, a.user_name_ar, a.user_name_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-assignee">{t('new_assignee')}</Label>
            <UserSearchCombobox
              value={newUserId}
              onChange={setNewUserId}
              placeholder={t('search_users')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="override-reason">{t('reason')}</Label>
            <Textarea
              id="override-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-required="true"
              placeholder={t('reason_placeholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAssigneeId || !newUserId || !reason || overrideMut.isPending}
          >
            {overrideMut.isPending ? t('submitting') : t('override')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
