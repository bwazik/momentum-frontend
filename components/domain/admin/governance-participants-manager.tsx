'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RtlTable } from '@/components/shared/rtl-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useGovernanceParticipantsInfinite } from '@/lib/api/hooks/use-confidential-governance';
import { apiClient } from '@/lib/api/client';
import { extraQueryKeys } from '@/lib/api/query-keys-extra';
import { toast } from 'sonner';
import { GovernanceRuleFormDialog } from './governance-rule-form-dialog';
import { GovernanceParticipantRow } from './governance-participant-row';
import { GovernanceParticipantMobileCard } from './governance-participant-mobile-card';
import { GovernanceTableSkeleton } from './governance-table-skeleton';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];

interface Props {
  openCreate: boolean;
  onOpenCreateChange: (open: boolean) => void;
}

export function GovernanceParticipantsManager({ openCreate, onOpenCreateChange }: Props) {
  const t = useTranslations('confidential.governance');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canManage = useCapability('iam.manage_capabilities');

  const filters = useMemo(() => ({
    scope_type: searchParams.get('scopeType') ?? undefined,
    status: (searchParams.get('status') as 'active' | 'revoked') ?? undefined,
  }), [searchParams]);

  const query = useGovernanceParticipantsInfinite(filters);
  const qc = useQueryClient();
  const revokeMutation = useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post(`/v1/iam/confidential-governance-participants/${publicId}/revoke`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: extraQueryKeys.iam.governanceParticipants() });
      toast.success(t('toast.revoked'));
      setRevokeItem(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const [editItem, setEditItem] = useState<GovernanceResource | null>(null);
  const [revokeItem, setRevokeItem] = useState<GovernanceResource | null>(null);

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleRevoke() {
    if (!revokeItem) return;
    revokeMutation.mutate(revokeItem.public_id);
  }

  const dialogOpen = openCreate || !!editItem;

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setEditItem(null);
      onOpenCreateChange(false);
    }
  }

  if (query.isLoading) return <GovernanceTableSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RtlSelect value={filters.scope_type ?? ''} onValueChange={(v) => setFilter('scopeType', v && v !== 'all' ? v : null)}>
          <SelectTrigger className="w-full" aria-label={t('filter_scope')}>
            <SelectValue placeholder={t('all_scopes')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_scopes')}</SelectItem>
            <SelectItem value="tenant">{t('scope_tenant')}</SelectItem>
            <SelectItem value="specific_department">{t('scope_specific_department')}</SelectItem>
            <SelectItem value="department_tree">{t('scope_department_tree')}</SelectItem>
          </SelectContent>
        </RtlSelect>
        <RtlSelect value={filters.status ?? ''} onValueChange={(v) => setFilter('status', v && v !== 'all' ? v : null)}>
          <SelectTrigger className="w-full" aria-label={t('filter_status')}>
            <SelectValue placeholder={t('all_statuses')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_statuses')}</SelectItem>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="revoked">{t('revoked_status')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ShieldOff} title={t('empty_title')} description={t('empty_description')} />
      ) : (
        <>
          <div className="hidden md:block">
            <RtlTable>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('columns.position')}</TableHead>
                  <TableHead className="text-start">{t('columns.scope')}</TableHead>
                  <TableHead className="text-start">{t('columns.target')}</TableHead>
                  <TableHead className="text-start">{t('columns.category')}</TableHead>
                  <TableHead className="text-start">{t('columns.classification')}</TableHead>
                  <TableHead className="text-start">{t('columns.status')}</TableHead>
                  <TableHead className="text-end">{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <GovernanceParticipantRow
                    key={item.public_id}
                    item={item}
                    canManage={canManage}
                    onEdit={() => { setEditItem(item); }}
                    onRevoke={() => setRevokeItem(item)}
                  />
                ))}
              </TableBody>
            </RtlTable>
          </div>
          <div className="md:hidden flex flex-col gap-4">
            {items.map((item) => (
              <GovernanceParticipantMobileCard
                key={item.public_id}
                item={item}
                canManage={canManage}
                onEdit={() => { setEditItem(item); }}
                onRevoke={() => setRevokeItem(item)}
              />
            ))}
          </div>
          {query.hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading') : t('load_more')}
            </Button>
          )}
        </>
      )}

      <GovernanceRuleFormDialog
        item={editItem ?? undefined}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />

      <ConfirmDeleteDialog
        open={!!revokeItem}
        onOpenChange={(open) => !open && setRevokeItem(null)}
        title={t('revoke_title')}
        description={t('revoke_description', { name: revokeItem ? localizeName(locale, revokeItem.position.title_ar, revokeItem.position.title_en) : '' })}
        confirmLabel={t('revoke_confirm')}
        cancelLabel={t('revoke_cancel')}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
