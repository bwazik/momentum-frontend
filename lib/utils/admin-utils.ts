const ACCOUNT_TYPE_MAP: Record<string, string> = {
  '1': 'internal_user', '2': 'tenant_admin', '3': 'external_auditor', '4': 'platform_admin',
  internal_user: 'internal_user', tenant_admin: 'tenant_admin',
  external_auditor: 'external_auditor', platform_admin: 'platform_admin',
};

export function formatAdminAccountType(accountType?: string | number): string {
  return ACCOUNT_TYPE_MAP[String(accountType ?? '')] ?? '';
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
