'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { localizeName } from '@/lib/utils/localize';
import { useCapabilities } from '@/lib/api/hooks/use-admin-access';
import { formatAdminAccountType, formatPreferredLanguage } from '@/lib/utils/admin-utils';
import type { components } from '@/lib/generated/api-types';

type UserDetailResource = components['schemas']['UserDetailResource'];

interface UserProfileTabProps {
  user: UserDetailResource;
}

export function UserProfileTab({ user }: UserProfileTabProps) {
  const t = useTranslations('admin.users.detail.profile');
  const tu = useTranslations('admin.users');
  const locale = useLocale();
  const { data: caps } = useCapabilities();

  const capMap = useMemo(() => {
    const map: Record<string, string> = {};
    (caps ?? []).forEach((c) => {
      map[c.key] = localizeName(locale, c.name_ar, c.name_en);
    });
    return map;
  }, [caps, locale]);

  const name = localizeName(locale, user.name_ar, user.name_en);
  const deptName = user.current_position?.position?.department
    ? localizeName(locale, user.current_position.position.department.name_ar, '')
    : '-';

  const fields = [
    { label: t('name'), value: name },
    { label: t('email'), value: user.email },
    { label: t('account_type'), value: tu(`account_type_${formatAdminAccountType(user.account_type)}`) },
    { label: t('status'), value: String(user.is_active) !== 'false' ? t('active') : t('inactive') },
    { label: t('language'), value: formatPreferredLanguage(locale, user.preferred_language) },
    { label: t('employee_id'), value: user.employee_id ?? '-' },
    { label: t('mobile'), value: user.mobile ?? '-' },
    { label: t('department'), value: deptName },
  ];

  return (
    <div className="flex flex-col gap-3 pb-4">
      {fields.map((f, i) => (
        <div key={f.label}>
          <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
          <p className="text-sm text-foreground">{f.value}</p>
          {i < fields.length - 1 && <Separator className="mt-3" />}
        </div>
      ))}

      {user.effective_capabilities && (
        <>
          <Separator />
          <div>
            <span className="text-xs font-medium text-muted-foreground">{t('effective_capabilities')}</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {String(user.effective_capabilities).split(',').filter(Boolean).map((cap) => (
                <span key={cap} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {capMap[cap.trim()] || cap.trim()}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
