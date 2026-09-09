import { HelpArticleEditorPageClient } from '@/components/domain/help/help-article-editor-page-client';

export default async function EditHelpArticlePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <main className="flex flex-col gap-6 p-6">
      <HelpArticleEditorPageClient mode="edit" publicId={publicId} />
    </main>
  );
}
