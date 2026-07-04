import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../../utils/test-utils';
import { server } from '../../../mocks/server';
import { TaskCommentsCard } from '@/components/domain/tasks/task-comments-card';

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args), success: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/tasks/test-uuid',
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, Record<string, string>> = {
      shared: {
        error: 'An error occurred.',
        retry: 'Try again',
      },
      'tasks.comments': {
        title: 'Comments',
        composer_label: 'New comment',
        composer_placeholder: 'Write your comment...',
        post_comment: 'Post Comment',
        post_reply: 'Post Reply',
        posting: 'Posting...',
        reply: 'Reply',
        reply_to: 'Reply to {author}',
        cancel: 'Cancel',
        load_more: 'Load more',
        loading_more: 'Loading...',
        empty_title: 'No comments yet',
        empty_description: 'Start the conversation by adding the first comment.',
        error: 'Unable to load comments.',
        toast_posted: 'Comment posted',
        comments_list_label: 'Comments',
        replies_list_label: 'Replies',
      },
      'tasks.detail': {
        time_just_now: 'Just now',
        time_less_than_1h: 'Less than 1 hour',
        time_minute_one: 'minute',
        time_minute_many: 'minutes',
        time_hour_one: 'hour',
        time_hour_many: 'hours',
        time_day_one: 'day',
        time_day_two: 'two days',
        time_day_many: 'days',
        time_ago_prefix: '',
        time_ago_suffix: ' ago',
        time_overdue_prefix: 'Overdue by ',
        time_at_risk: 'At risk',
        time_remaining: ' remaining',
        time_due_today: 'Due today',
        time_paused: 'Paused',
        time_completed: 'Completed',
      },
    };
    const ns = translations[namespace];
    return ns?.[key] ?? (params ? `{${key}}` : key);
  },
  useLocale: () => 'ar',
}));

beforeEach(() => {
  server.use(
    http.get('https://api.momentum.test/v1/iam/auth/me', () => {
      return HttpResponse.json({
        public_id: 'user-1',
        name_ar: 'المستخدم',
        name_en: 'Current User',
      });
    }),
  );
});

test('renders loading skeleton', () => {
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);
  expect(screen.getByTestId('task-comments-skeleton')).toBeInTheDocument();
});

test('renders comments and allows reply interaction', async () => {
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('هل يمكن توضيح المطلوب؟');

  expect(screen.getByText('Reply')).toBeInTheDocument();
  expect(screen.getByText('سأرسل التفاصيل الآن.')).toBeInTheDocument();
});

test('shows empty state when no comments', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
      return HttpResponse.json({
        data: [],
        next_cursor: null,
        has_more: false,
      });
    }),
  );

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('No comments yet');
});

test('shows error state on API failure', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('Unable to load comments.');
});

test('posts a top-level comment', async () => {
  const user = userEvent.setup();

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('هل يمكن توضيح المطلوب؟');

  const textarea = screen.getByPlaceholderText('Write your comment...');
  await user.type(textarea, 'تعليق جديد');

  const postButton = screen.getByRole('button', { name: /post comment/i });
  await user.click(postButton);

  await waitFor(() => {
    expect(textarea).toHaveValue('');
  });
});

test('posts a reply to a comment', async () => {
  const user = userEvent.setup();

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('هل يمكن توضيح المطلوب؟');

  const replyButton = screen.getByRole('button', { name: /reply/i });
  await user.click(replyButton);

  const textareas = screen.getAllByPlaceholderText('Write your comment...');
  const replyTextarea = textareas[0];
  await user.type(replyTextarea, 'رد على التعليق');

  const postReplyButton = screen.getByRole('button', { name: /post reply/i });
  await user.click(postReplyButton);

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /post reply/i })).not.toBeInTheDocument();
  });
});

test('shows load more button when hasNextPage is true', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
      return HttpResponse.json({
        data: [
          {
            public_id: '01912a00-0000-7000-8000-000000000001',
            task_id: 'task-uuid-1',
            author: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmad' },
            body: 'أول تعليق',
            parent_comment_id: '',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            attachment_count: 0,
            replies: [],
          },
        ],
        next_cursor: 'cursor-2',
        has_more: true,
      });
    }),
  );

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('أول تعليق');
  expect(screen.getByText('Load more')).toBeInTheDocument();
});

test('error state retry refetches comments', async () => {
  const user = userEvent.setup();

  server.use(
    http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('Unable to load comments.');

  server.resetHandlers();
  server.use(
    http.get('https://api.momentum.test/v1/iam/auth/me', () => {
      return HttpResponse.json({
        public_id: 'user-1',
        name_ar: 'المستخدم',
        name_en: 'Current User',
      });
    }),
  );

  const retryButton = screen.getByRole('button', { name: /try again/i });
  await user.click(retryButton);

  await waitFor(() => {
    expect(screen.queryByText('Unable to load comments.')).not.toBeInTheDocument();
  });
});

test('shows toast error on 422 for posting', async () => {
  server.use(
    http.post('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
      return HttpResponse.json(
        { message: 'Body is too long.' },
        { status: 422 },
      );
    }),
  );

  const user = userEvent.setup();
  mockToastError.mockClear();
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('هل يمكن توضيح المطلوب؟');

  const textarea = screen.getByPlaceholderText('Write your comment...');
  await user.type(textarea, 'نص طويل جدا');

  const postButton = screen.getByRole('button', { name: /post comment/i });
  await user.click(postButton);

  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalledWith('Body is too long.');
  });
});

test('renders comment card with expected English labels', async () => {
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);

  await screen.findByText('Reply');

  expect(screen.getByText('Comments')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
});
