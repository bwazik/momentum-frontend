'use client';

import { useMemo } from 'react';
import { renderArticleMarkdown } from '@/lib/utils/help-center-utils';

interface HelpArticleContentProps {
  content: string;
  locale?: 'ar' | 'en';
}

export function HelpArticleContent({ content, locale = 'ar' }: HelpArticleContentProps) {
  const sanitized = useMemo(() => renderArticleMarkdown(content), [content]);

  return (
    <article
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:shadow-xs prose-table:border prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-pre:bg-muted/80 prose-pre:text-foreground prose-code:text-primary"
      data-testid="help-article-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
