'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type LocalizationContextResource = components['schemas']['LocalizationContextResource'];
type DateConversionResource = components['schemas']['DateConversionResource'];
type CalendarSystem = components['schemas']['CalendarSystem'];

export function useLocalizationContext() {
  return useQuery({
    queryKey: queryKeys.localization.context(),
    queryFn: () => apiClient.get<LocalizationContextResource>('/v1/localization/context'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

interface DateConversionParams {
  date: string;
  from_calendar: CalendarSystem;
}

export function useDateConversion(params: DateConversionParams | null) {
  const queryParams: Record<string, string> = params ?? { date: '', from_calendar: 'gregorian' };
  return useQuery({
    queryKey: queryKeys.localization.dateConversion(queryParams),
    queryFn: () =>
      apiClient.get<DateConversionResource>('/v1/localization/date-conversion', {
        params: queryParams,
      }),
    enabled: !!params?.date,
    staleTime: Infinity,
    retry: 1,
  });
}

export type { CalendarSystem };
