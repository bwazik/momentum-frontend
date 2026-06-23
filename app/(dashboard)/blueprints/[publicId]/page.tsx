import { BlueprintBuilder } from '@/components/domain/blueprints/blueprint-builder';

export default async function BlueprintBuilderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return (
    <main className="flex flex-col p-6">
      <BlueprintBuilder publicId={publicId} />
    </main>
  );
}
