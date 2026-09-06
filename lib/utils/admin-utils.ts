const ACCOUNT_TYPE_LABELS: Record<string, { ar: string; en: string; key: string }> = {
  '1': { ar: 'مستخدم داخلي', en: 'Internal User', key: 'internal_user' },
  '2': { ar: 'مدير المستأجر', en: 'Tenant Admin', key: 'tenant_admin' },
  '3': { ar: 'مدقق خارجي', en: 'External Auditor', key: 'external_auditor' },
  '4': { ar: 'مدير المنصة', en: 'Platform Admin', key: 'platform_admin' },
  internal_user: { ar: 'مستخدم داخلي', en: 'Internal User', key: 'internal_user' },
  tenant_admin: { ar: 'مدير المستأجر', en: 'Tenant Admin', key: 'tenant_admin' },
  external_auditor: { ar: 'مدقق خارجي', en: 'External Auditor', key: 'external_auditor' },
  platform_admin: { ar: 'مدير المنصة', en: 'Platform Admin', key: 'platform_admin' },
};

export function formatAdminAccountType(localeOrType?: string | number, accountType?: string | number): string {
  if (typeof localeOrType === 'string' && (localeOrType === 'ar' || localeOrType === 'en') && accountType !== undefined) {
    const label = ACCOUNT_TYPE_LABELS[String(accountType)];
    if (!label) return '';
    return localeOrType === 'ar' ? label.ar : label.en;
  }
  // Single-arg path: return the snake_case key used in translation files
  const label = ACCOUNT_TYPE_LABELS[String(localeOrType ?? '')];
  return label ? label.key : '';
}

export function formatAdminScopeType(locale: string, scopeType?: number): string {
  if (locale === 'ar') {
    switch (scopeType) {
      case 1: return 'على مستوى المستأجر';
      case 2: return 'إدارتي';
      case 3: return 'إدارة محددة';
      case 4: return 'شجرة الإدارة';
      case 5: return 'مهامي';
      default: return '';
    }
  }
  switch (scopeType) {
    case 1: return 'Tenant-wide';
    case 2: return 'Own Department';
    case 3: return 'Specific Department';
    case 4: return 'Department Tree';
    case 5: return 'Own Tasks';
    default: return '';
  }
}

export function needsDepartment(scopeType: number): boolean {
  return scopeType === 3 || scopeType === 4;
}

export function formatUserStatus(locale: string, isActive: boolean): string {
  if (locale === 'ar') return isActive ? 'نشط' : 'غير نشط';
  return isActive ? 'Active' : 'Inactive';
}

const PREFERRED_LANGUAGE_KEY_MAP: Record<string, string> = {
  '1': 'arabic', '2': 'english', arabic: 'arabic', english: 'english',
};

const PREFERRED_LANGUAGE_LABELS: Record<string, { ar: string; en: string }> = {
  arabic: { ar: 'العربية', en: 'Arabic' },
  english: { ar: 'الإنجليزية', en: 'English' },
};

export function formatPreferredLanguage(locale: string, lang?: string | number): string {
  const key = PREFERRED_LANGUAGE_KEY_MAP[String(lang ?? '1')] ?? '';
  const label = PREFERRED_LANGUAGE_LABELS[key];
  if (!label) return '';
  return locale === 'ar' ? label.ar : label.en;
}
