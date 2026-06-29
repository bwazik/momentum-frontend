'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, FileQuestion, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useTaskFormStore, ManualAssignments } from '@/lib/stores/use-task-form-store';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-board';
import { useCreateTask, useUpdateTask, useLaunchTask, toApiManual } from '@/lib/api/hooks/use-task-create';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ApiRequestError } from '@/lib/api/client';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TaskFormSkeleton } from './task-form-skeleton';
import { TaskFormFields } from './task-form-fields';
import { TaskFormFooter } from './task-form-footer';


interface Props {
  mode: 'create' | 'edit';
  publicId?: string;
}

export function TaskCreationForm({ mode, publicId }: Props) {
  const t = useTranslations('tasks.new');
  const tt = useTranslations('tasks.create.toast');
  const locale = useLocale();
  const router = useRouter();
  const priorityId = useTaskFormStore((s) => s.priorityId);
  const blueprintId = useTaskFormStore((s) => s.blueprintId);
  const manualAssignments = useTaskFormStore((s) => s.manualAssignments);
  const titleAr = useTaskFormStore((s) => s.title_ar);
  const titleEn = useTaskFormStore((s) => s.title_en);
  const descAr = useTaskFormStore((s) => s.description_ar);
  const descEn = useTaskFormStore((s) => s.description_en);
  const dueDate = useTaskFormStore((s) => s.dueDate);
  const classificationLevel = useTaskFormStore((s) => s.classificationLevel);
  const storeSet = useTaskFormStore((s) => s.set);
  const storeSetManual = useTaskFormStore((s) => s.setManual);
  const storeInitEdit = useTaskFormStore((s) => s.initEdit);
  const storeReset = useTaskFormStore((s) => s.reset);
  const setDisplayId = useTaskDisplayStore((s) => s.setDisplayId);
  const { data: user } = useCurrentUser();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const launchTask = useLaunchTask();
  const canManage = useCapability('task.manage');
  const canClassifyConfidential = useCapability('task.classify.confidential');

  const detail = useTaskDetail(publicId ?? '');
  const { data: prioritiesData } = useTaskPriorities();
  const priorityInitRef = useRef(false);

  useEffect(() => {
    if (priorityInitRef.current || mode === 'edit' || !prioritiesData) return;
    priorityInitRef.current = true;
    const defaultPriority = prioritiesData.find((p) => String(p.is_default) === '1');
    if (defaultPriority && !priorityId) {
      storeSet('priorityId', defaultPriority.public_id);
    }
  }, [mode, prioritiesData, priorityId, storeSet]);

  useEffect(() => {
    if (mode === 'edit' && publicId && detail.data) {
      const d = detail.data;
      if (d.status !== 'draft') {
        router.replace(`/tasks/${publicId}`);
        return;
      }
      const isInitiator = d.initiator_id === user?.public_id;
      if (!isInitiator && !canManage) {
        return;
      }
      if (d.display_id) setDisplayId(d.display_id);
      const bpName = d.blueprint
        ? localizeName(locale, d.blueprint.name_ar, d.blueprint.name_en)
        : '';
      storeInitEdit(publicId, {
        title_ar: d.title_ar,
        title_en: d.title_en,
        description_ar: d.description_ar,
        description_en: d.description_en,
        priorityId: d.priority?.public_id ?? null,
        classificationLevel: (Number(d.classification_level) || 1) as 1 | 2 | 3,
        dueDate: d.due_date ?? null,
        blueprintId: d.blueprint?.public_id ?? '',
        blueprintName: bpName,
      });
      if (d.draft_manual_assignments) {
        const raw = typeof d.draft_manual_assignments === 'string'
          ? JSON.parse(d.draft_manual_assignments)
          : d.draft_manual_assignments;
        const entries = Array.isArray(raw) ? raw : [];
        for (const entry of entries) {
          const key = entry.blueprint_sub_stage_id
            ? `sub:${entry.blueprint_sub_stage_id}`
            : entry.blueprint_stage_id;
          if (key) storeSetManual(key, entry.user_ids);
        }
      }
    }
    return () => {
      if (mode === 'create') storeReset();
    };
  }, [mode, publicId, detail.data, canManage, user, locale, router, setDisplayId, storeInitEdit, storeReset, storeSetManual]);

  const selectedBlueprint = useBlueprint(blueprintId ?? '');

  const manualItems = useMemo(() => {
    const stages = selectedBlueprint.data?.stages ?? [];
    if (stages.length === 0) return [];
    const first = [...stages].sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order))[0];
    const items: { kind: 'stage' | 'sub'; public_id: string; name_ar: string; name_en: string }[] = [];
    if (first.assignment_type === 'manual_at_launch') {
      items.push({ kind: 'stage', public_id: first.public_id, name_ar: first.name_ar, name_en: first.name_en });
    }
    for (const sub of first.sub_stages ?? []) {
      if (sub.assignment_type === 'manual_at_launch') {
        items.push({ kind: 'sub', public_id: sub.public_id, name_ar: sub.name_ar, name_en: sub.name_en });
      }
    }
    return items;
  }, [selectedBlueprint.data]);

  if (mode === 'edit') {
    if (detail.error instanceof ApiRequestError) {
      if (detail.error.status === 403) {
        return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_desc')} />;
      }
      if (detail.error.status === 404) {
        return (
          <EmptyState
            icon={FileQuestion}
            title={t('not_found_title')}
            action={<Link href="/tasks">{t('back_to_tasks')}</Link>}
          />
        );
      }
      return <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;
    }
    if (detail.isLoading) return <TaskFormSkeleton />;
  }

  const validateManuals = (): { ok: true } | { ok: false; message: string } => {
    for (const item of manualItems) {
      const key = item.kind === 'sub' ? `sub:${item.public_id}` : item.public_id;
      const ids = manualAssignments[key] ?? [];
      if (ids.length === 0) {
        const name = localizeName(locale, item.name_ar, item.name_en);
        return { ok: false, message: t('manual_required', { name }) };
      }
    }
    return { ok: true };
  };

  const persist = async (): Promise<string | null> => {
    const manualBody: ManualAssignments = Object.fromEntries(
      Object.entries(manualAssignments).filter(([, ids]) => ids.length > 0),
    );
    try {
      if (mode === 'create') {
        const created = await createTask.mutateAsync({
          blueprint_id: blueprintId as string,
          priority_id: priorityId ?? undefined,
          title_ar: titleAr,
          title_en: titleEn || undefined,
          description_ar: descAr,
          description_en: descEn || undefined,
          classification_level: classificationLevel,
          due_date: dueDate ?? undefined,
          manual_assignments: Object.keys(manualBody).length > 0
            ? toApiManual(manualBody)
            : undefined,
        });
        return created.public_id;
      } else {
        await updateTask.mutateAsync({
          publicId: publicId!,
          body: {
            title_ar: titleAr,
            title_en: titleEn || undefined,
            description_ar: descAr,
            description_en: descEn || undefined,
            classification_level: classificationLevel,
            due_date: dueDate ?? undefined,
          } as components['schemas']['UpdateTaskRequest'],
        });
        return publicId!;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return null;
    }
  };

  const onSaveDraft = async () => {
    const pid = await persist();
    if (pid) {
      toast.success(tt('saved'));
      router.push(`/tasks/${pid}`);
    }
  };

  const onLaunch = async () => {
    const v = validateManuals();
    if (!v.ok) { toast.error(v.message); return; }
    const pid = await persist();
    if (!pid) return;
    try {
      await launchTask.mutateAsync({ publicId: pid, manualAssignments });
      router.push(`/tasks/${pid}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const isInitiator =
    mode === 'edit' && detail.data ? detail.data.initiator_id === user?.public_id : false;

  return (
    <>
      <Card className="flex flex-col gap-6 p-6">
        <FieldGroup>
          <TaskFormFields
            mode={mode}
            manualItems={manualItems}
            canClassifyConfidential={canClassifyConfidential}
          />
        </FieldGroup>

        <TaskFormFooter
          mode={mode}
          priorities={prioritiesData ?? []}
          hasManualItems={manualItems.length > 0}
          isSaving={createTask.isPending || updateTask.isPending}
          isLaunching={createTask.isPending || updateTask.isPending || launchTask.isPending}
          onSaveDraft={onSaveDraft}
          onLaunch={onLaunch}
        />
      </Card>
    </>
  );
}
