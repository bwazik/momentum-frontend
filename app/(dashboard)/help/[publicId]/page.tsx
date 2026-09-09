import { HelpArticleReaderPageClient } from '@/components/domain/help/help-article-reader-page-client';

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <main className="flex flex-col gap-6 p-6">
      <HelpArticleReaderPageClient publicId={publicId} />
    </main>
  );
}
