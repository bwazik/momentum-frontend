'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface LoadMoreButtonProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function LoadMoreButton({ hasNextPage, isFetchingNextPage, onLoadMore }: LoadMoreButtonProps) {
  const t = useTranslations('organization');
  if (!hasNextPage) return null;
  return (
    <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage} className="w-full">
      {isFetchingNextPage ? t('actions.loading') : t('actions.load_more')}
    </Button>
  );
}
