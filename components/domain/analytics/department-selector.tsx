'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { RtlSelect } from '@/components/shared/rtl-select';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartmentsInfinite, useDepartment } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';

interface DepartmentSelectorProps {
  departmentId: string;
  canSelect: boolean;
}

export function DepartmentSelector({ departmentId, canSelect }: DepartmentSelectorProps) {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: department, isLoading: isDepartmentLoading } = useDepartment(
    canSelect ? '' : departmentId,
  );

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('departmentId', value);
    params.delete('assigneeId');
    params.delete('status');
    params.delete('slaHealth');
    params.delete('dateFrom');
    params.delete('dateTo');
    params.delete('priorityId');
    params.delete('blueprintCategoryId');
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (!canSelect) {
    if (isDepartmentLoading) return <Skeleton className="h-9 w-48" />;
    if (departmentId && department) {
      const name = localizeName(locale, department.name_ar, department.name_en);
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('department_label')}</span>
          <span className="text-base font-semibold">{name}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('department_label')}</span>
        <span className="text-base text-muted-foreground">{t('select_department')}</span>
      </div>
    );
  }

  return <DepartmentSelectorDropdown departmentId={departmentId} handleChange={handleChange} />;
}

function DepartmentSelectorDropdown({ departmentId, handleChange }: { departmentId: string; handleChange: (value: string) => void }) {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useDepartmentsInfinite({ is_active: true });
  const departments = departmentsData?.pages.flatMap((p) => p.data) ?? [];

  return (
    <RtlSelect value={departmentId || ''} onValueChange={handleChange} disabled={isDepartmentsLoading}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('select_department')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {departments.map((d) => (
            <SelectItem key={d.public_id} value={d.public_id}>
              {localizeName(locale, d.name_ar, d.name_en)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </RtlSelect>
  );
}
