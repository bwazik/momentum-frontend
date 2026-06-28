import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { WorkingCalendarsPanel } from '@/components/domain/organization/working-calendars-panel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/organization',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const t: Record<string, Record<string, string>> = {
      organization: {
        'tabs.calendars': 'Calendars',
        'actions.add_calendar': 'Add Calendar',
        'actions.add_holiday': 'Add Holiday',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'actions.make_default': 'Make Default',
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'actions.saving': 'Saving...',
        'actions.loading': 'Loading...',
        'empty.no_calendars': 'No calendars',
        'empty.no_calendars_desc': 'Add the first calendar.',
        'empty.no_holidays': 'No holidays',
        'empty.no_holidays_desc': 'Add the first holiday.',
        'dialogs.name_ar': 'Name',
        'dialogs.add_calendar': 'Add Calendar',
        'dialogs.edit_calendar': 'Edit Calendar',
        'dialogs.working_days': 'Working Days',
        'dialogs.working_hours_start': 'Start',
        'dialogs.working_hours_end': 'End',
        'dialogs.timezone': 'Timezone',
        'dialogs.is_default': 'Set as default',
        'dialogs.add_holiday': 'Add Holiday',
        'dialogs.edit_holiday': 'Edit Holiday',
        'dialogs.date': 'Date',
        'dialogs.is_recurring': 'Recurring',
        'dialogs.make_default_title': 'Set as Default',
        'dialogs.make_default_desc': 'Continue?',
        'dialogs.confirm': 'Confirm',
        'dialogs.year': 'Year',
        'dialogs.name_ar_required': 'Name required',
        'dialogs.name_ar_placeholder': 'Enter name',
        'days.sun': 'Sunday',
        'days.mon': 'Monday',
        'days.tue': 'Tuesday',
        'days.wed': 'Wednesday',
        'days.thu': 'Thursday',
        'days.fri': 'Friday',
        'days.sat': 'Saturday',
        'days.short.sun': 'Sun',
        'days.short.mon': 'Mon',
        'days.short.tue': 'Tue',
        'days.short.wed': 'Wed',
        'days.short.thu': 'Thu',
        'days.short.fri': 'Fri',
        'days.short.sat': 'Sat',
      },
    };
    return t[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
  useParams: () => ({}),
}));

describe('WorkingCalendarsPanel', () => {
  it('renders calendar cards with data', async () => {
    renderWithProviders(<WorkingCalendarsPanel />);
    expect(await screen.findByText('Default')).toBeInTheDocument();
  });

  it('shows empty state when no calendars', async () => {
    server.use(
      http.get('https://api.momentum.test/v1/organization/working-calendars', () =>
        HttpResponse.json([]),
      ),
    );

    renderWithProviders(<WorkingCalendarsPanel />);
    expect(await screen.findByText('Add the first calendar.')).toBeInTheDocument();
  });
});
