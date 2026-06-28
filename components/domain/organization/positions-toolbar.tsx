'use client';

import { useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localizeName } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];

interface PositionsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isActive: boolean | undefined;
  onActiveChange: (value: boolean | null) => void;
  departmentId: string | undefined;
  onDepartmentChange: (value: string | null) => void;
  gradeId: string | undefined;
  onGradeChange: (value: string | null) => void;
  departments: DepartmentTreeResource[];
  grades: AuthorityGradeResource[];
}

export function PositionsToolbar({
  search,
  onSearchChange,
  isActive,
  onActiveChange,
  departmentId,
  onDepartmentChange,
  gradeId,
  onGradeChange,
  departments,
  grades,
}: PositionsToolbarProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const [localSearch, setLocalSearch] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange],
  );

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={t('departments.search_placeholder')}
          className="ps-8"
        />
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1">
          <RtlSelect value={departmentId ?? '__all__'} onValueChange={(v) => onDepartmentChange(v === '__all__' ? null : v)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder={t('dialogs.department_placeholder')} />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[260px] overflow-y-auto">
              <SelectItem value="__all__">{t('departments.all_departments')}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.public_id} value={dept.public_id}>
                  {localizeName(dept, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </RtlSelect>
        </div>
        <div className="flex-1">
          <RtlSelect value={gradeId ?? '__all__'} onValueChange={(v) => onGradeChange(v === '__all__' ? null : v)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder={t('dialogs.grade_placeholder')} />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="__all__">{t('departments.all_grades')}</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade.public_id} value={grade.public_id}>
                  {grade.rank} — {localizeName(grade, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </RtlSelect>
        </div>
        <ToggleGroup
          type="single"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          value={isActive === undefined ? 'all' : isActive ? 'active' : 'inactive'}
          onValueChange={(v: string) => {
            if (v === 'all') onActiveChange(null);
            else if (v === 'active') onActiveChange(true);
            else onActiveChange(false);
          }}
          className="[&_[data-state=on]]:!bg-primary [&_[data-state=on]]:!text-primary-foreground"
        >
          <ToggleGroupItem value="all" size="sm">{t('departments.all')}</ToggleGroupItem>
          <ToggleGroupItem value="active" size="sm">{t('status.active')}</ToggleGroupItem>
          <ToggleGroupItem value="inactive" size="sm">{t('status.inactive')}</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
