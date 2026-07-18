'use client';

import { useTranslations, useLocale } from 'next-intl';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InfoAlert } from '@/components/shared/info-alert';
import { Button } from '@/components/ui/button';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { SlaBadge, TaskStatusBadge, ClassificationBadge } from './task-badges';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName } from '@/lib/utils/localize';
import type { operations } from '@/lib/generated/api-types';

type TaskMetadataResource = operations['confidentialAccess.metadata']['responses']['200']['content']['application/json'];

function resolveName(value: string | { name_ar?: string; name_en?: string } | undefined | null, locale: string): string {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  return localizeName(locale, value.name_ar, value.name_en);
}

interface Props {
  metadata: TaskMetadataResource;
  taskPublicId: string;
  onRequestOverride: () => void;
}

export function ConfidentialMetadataPage({ metadata, onRequestOverride }: Props) {
  const t = useTranslations('confidential.metadata');
  const locale = useLocale();
  const canOverride = useCapability('task.confidential.view_override');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <InfoAlert
        title={t('alert_title')}
        description={t('alert_description')}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge level={metadata.classification_level} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{metadata.title}</h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetadataRow label={t('department')} value={resolveName(metadata.owning_department, locale)} />
          <MetadataRow label={t('responsible_position')} value={resolveName(metadata.current_responsible_position, locale)} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('status')}</span>
            <TaskStatusBadge status={metadata.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('sla_health')}</span>
            <SlaBadge health={metadata.sla_health ?? undefined} status={metadata.status} />
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm text-muted-foreground">{t('due_date')}</span>
            <DualDateDisplay gregorian={metadata.due_date} />
          </div>

          {canOverride && (
            <Button onClick={onRequestOverride} className="w-full sm:w-auto">
              {t('open_content')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
