import { HelpArticleEditorPageClient } from '@/components/domain/help/help-article-editor-page-client';

export default function NewHelpArticlePage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <HelpArticleEditorPageClient mode="create" />
    </main>
  );
}
