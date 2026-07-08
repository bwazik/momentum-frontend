import {
  type LucideIcon,
  ClipboardList,
  ExternalLink,
  FileSignature,
  Link2,
  Mail,
  ScrollText,
  Shield,
  Store,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

export const EXTERNAL_REFERENCE_TYPE_VALUES = [
  'correspondence',
  'contract',
  'ministerialdecision',
  'authoritydecision',
  'meetingminute',
  'externalorgrequest',
  'vendorreference',
  'other',
] as const;

export const EXTERNAL_REFERENCE_TYPE_ICONS: Record<string, LucideIcon> = {
  correspondence: Mail,
  contract: FileSignature,
  ministerialdecision: ScrollText,
  authoritydecision: Shield,
  meetingminute: ClipboardList,
  externalorgrequest: ExternalLink,
  vendorreference: Store,
  other: Link2,
};

export type ExternalReferenceTypeValue = typeof EXTERNAL_REFERENCE_TYPE_VALUES[number];

export const EXTERNAL_REFERENCE_TYPE_KEYS: Record<string, string> = {
  correspondence: 'reference_type_correspondence',
  contract: 'reference_type_contract',
  ministerialdecision: 'reference_type_ministerialdecision',
  authoritydecision: 'reference_type_authoritydecision',
  meetingminute: 'reference_type_meetingminute',
  externalorgrequest: 'reference_type_externalorgrequest',
  vendorreference: 'reference_type_vendorreference',
  other: 'reference_type_other',
};

export const EXTERNAL_REFERENCE_TYPE_MAP: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = {
  correspondence: 1,
  contract: 2,
  ministerialdecision: 3,
  authoritydecision: 4,
  meetingminute: 5,
  externalorgrequest: 6,
  vendorreference: 7,
  other: 8,
};

export const EXTERNAL_ENTITY_TYPE_VALUES = [
  'governmentministry',
  'governmentauthority',
  'semigovernment',
  'university',
  'hospital',
  'privatecompany',
  'vendor',
  'other',
] as const;

export type ExternalEntityTypeValue = typeof EXTERNAL_ENTITY_TYPE_VALUES[number];

export const EXTERNAL_ENTITY_TYPE_KEYS: Record<string, string> = {
  governmentministry: 'entity_type_governmentministry',
  governmentauthority: 'entity_type_governmentauthority',
  semigovernment: 'entity_type_semigovernment',
  university: 'entity_type_university',
  hospital: 'entity_type_hospital',
  privatecompany: 'entity_type_privatecompany',
  vendor: 'entity_type_vendor',
  other: 'entity_type_other',
};

export const EXTERNAL_ENTITY_TYPE_MAP: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = {
  governmentministry: 1,
  governmentauthority: 2,
  semigovernment: 3,
  university: 4,
  hospital: 5,
  privatecompany: 6,
  vendor: 7,
  other: 8,
};

export function useReferenceTypeLabel(value?: string): string {
  const t = useTranslations('tasks.references');
  return useMemo(() => {
    if (!value) return t('reference_type_other');
    return t(EXTERNAL_REFERENCE_TYPE_KEYS[value] ?? 'reference_type_other');
  }, [value, t]);
}

export function useEntityTypeLabel(value?: string): string {
  const t = useTranslations('tasks.entities');
  return useMemo(() => {
    if (!value) return '';
    return t(EXTERNAL_ENTITY_TYPE_KEYS[value] ?? 'entity_type_other');
  }, [value, t]);
}
