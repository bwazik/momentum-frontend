'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LockBadge, ScopeBadge } from './blueprint-badges';
import { ActiveBadge } from '@/components/shared/active-badge';
import { BlueprintRowActions } from './blueprint-row-actions';
import { localizeName } from '@/lib/utils/localize';
import { getStagesCount } from './blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BlueprintTableProps {
  blueprints: BlueprintResource[];
  onHover: (publicId: string) => void;
}

export function BlueprintTable({ blueprints, onHover }: BlueprintTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('blueprints.library.columns');

  function open(id: string) { router.push(`/blueprints/${id}`); }

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-50 text-start">{t('name')}</TableHead>
          <TableHead className="w-32 text-start">{t('scope')}</TableHead>
          <TableHead className="w-28 text-start">{t('status')}</TableHead>
          <TableHead className="w-20 text-start">{t('stages')}</TableHead>
          <TableHead className="w-12 text-end">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-b-0">
        {blueprints.map((bp) => {
          const name = localizeName(locale, bp.name_ar, bp.name_en);
          const stagesCount = getStagesCount(bp);
          return (
            <TableRow key={bp.public_id} tabIndex={0} className="cursor-pointer"
              onClick={() => open(bp.public_id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(bp.public_id); } }}
              onMouseEnter={() => onHover(bp.public_id)}>
              <TableCell className="text-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{name}</span>
                  {bp.category && (
                    <span className="text-xs text-muted-foreground">
                      {localizeName(locale, bp.category.name_ar, bp.category.name_en)}
                    </span>
                  )}
                  {bp.is_locked && <LockBadge />}
                </div>
              </TableCell>
              <TableCell className="text-start"><ScopeBadge scope={bp.scope} /></TableCell>
              <TableCell className="text-start">
                <ActiveBadge isActive={!!bp.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
              </TableCell>
              <TableCell className="text-start text-sm text-muted-foreground">{stagesCount}</TableCell>
              <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                <BlueprintRowActions blueprint={bp} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
