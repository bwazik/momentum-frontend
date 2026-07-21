'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCapabilities } from '@/lib/api/hooks/use-admin-access';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName } from '@/lib/utils/localize';
import { Search, Pencil } from 'lucide-react';
import { CapabilityEditDialog } from './capability-edit-dialog';
import type { components } from '@/lib/generated/api-types';

type CapabilityResource = components['schemas']['CapabilityResource'];

export function CapabilityCatalog() {
  const t = useTranslations('admin.access.catalog');
  const locale = useLocale();
  const { data: caps, isLoading } = useCapabilities();
  const canManageCapabilities = useCapability('iam.manage_capabilities');
  const [search, setSearch] = useState('');
  const [editCap, setEditCap] = useState<CapabilityResource | null>(null);

  const filtered = useMemo(() => {
    if (!caps) return [];
    if (!search.trim()) return caps;
    const q = search.toLowerCase();
    return caps.filter((c) =>
      c.key.toLowerCase().includes(q) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(q)) ||
      (c.name_en && c.name_en.toLowerCase().includes(q))
    );
  }, [caps, search]);

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <RtlTable aria-label={t('table_aria_label')}>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('col_key')}</TableHead>
              <TableHead className="text-start">{t('col_name')}</TableHead>
              <TableHead className="text-start">{t('col_description')}</TableHead>
              <TableHead className="text-start">{t('source')}</TableHead>
              {canManageCapabilities && <TableHead className="w-12 text-end" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cap) => (
              <TableRow key={cap.public_id}>
                <TableCell className="font-mono text-xs">{cap.key}</TableCell>
                <TableCell>{localizeName(locale, cap.name_ar, cap.name_en)}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{cap.description}</TableCell>
                <TableCell>
                  {cap.is_system_defined ? (
                    <Badge variant="secondary" className="text-xs">{t('system_defined')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">{t('custom')}</Badge>
                  )}
                </TableCell>
                {canManageCapabilities && (
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditCap(cap)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </RtlTable>
      )}
      {editCap && (
        <CapabilityEditDialog
          capability={editCap}
          open={!!editCap}
          onOpenChange={() => setEditCap(null)}
        />
      )}
    </div>
  );
}
