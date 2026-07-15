'use client';

import { useTranslations } from 'next-intl';
import { DatePicker } from '@/components/shared/date-picker';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

interface DueDateFieldProps {
  calendarSystem: 'gregorian' | 'hijri';
  onCalendarSystemChange: (value: 'gregorian' | 'hijri') => void;
}

export function DueDateField({ calendarSystem, onCalendarSystemChange }: DueDateFieldProps) {
  const t = useTranslations('tasks.new');
  const dueDate = useTaskFormStore((s) => s.dueDate);
  const set = useTaskFormStore((s) => s.set);

  function handleChange(value: string | null, nextCalendar: 'gregorian' | 'hijri') {
    set('dueDate', value);
    if (nextCalendar !== calendarSystem) onCalendarSystemChange(nextCalendar);
  }

  return (
    <DatePicker
      id="due-date"
      label={t('due_date')}
      value={dueDate}
      calendarSystem={calendarSystem}
      onChange={handleChange}
      required
    />
  );
}
