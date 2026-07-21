'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import { formatAdminAccountType } from '@/lib/utils/admin-utils';
import { useAdminUserDetail } from '@/lib/api/hooks/use-admin-users';
import { UserProfileTab } from './user-profile-tab';
import { UserPositionAssignments } from './user-position-assignments';
import { UserAccessTab } from './user-access-tab';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { ErrorState } from '@/components/shared/error-state';

interface UserDetailSheetProps {
  publicId: string;
  onClose: () => void;
}

export function UserDetailSheet({ publicId, onClose }: UserDetailSheetProps) {
  const locale = useLocale();
  const t = useTranslations('admin.users.detail');
  const tu = useTranslations('admin.users');
  const side = locale === 'ar' ? 'left' : 'right';
  const detail = useAdminUserDetail(publicId);

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side={side} className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          {detail.data && (
            <SheetDescription>
              {localizeName(locale, detail.data.name_ar, detail.data.name_en)} — {detail.data.email}
            </SheetDescription>
          )}
        </SheetHeader>
        {detail.isLoading ? (
          <UserDetailSkeleton />
        ) : detail.isError ? (
          <ErrorState onRetry={() => detail.refetch()} message={t('error')} />
        ) : detail.data ? (
          <div className="px-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 mt-4">
              <span className="text-sm font-medium text-muted-foreground">{t('profile.account_type')}</span>
              <div className="flex items-center gap-2">
                <ActiveBadge
                  isActive={String(detail.data.is_active) !== 'false'}
                  activeLabel={t('profile.active')}
                  inactiveLabel={t('profile.inactive')}
                />
                <Badge variant="secondary" className="text-[10px]">
                  {tu(`account_type_${formatAdminAccountType(detail.data.account_type)}`)}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <Tabs defaultValue="profile">
              <TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}>
                <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
                <TabsTrigger value="positions">{t('tabs.positions')}</TabsTrigger>
                <TabsTrigger value="access">{t('tabs.access')}</TabsTrigger>
              </TabsList>
              <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <TabsContent value="profile" className="mt-4">
                  <UserProfileTab user={detail.data} />
                </TabsContent>
                <TabsContent value="positions" className="mt-4">
                  <UserPositionAssignments userPublicId={publicId} />
                </TabsContent>
                <TabsContent value="access" className="mt-4">
                  <UserAccessTab user={detail.data} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
