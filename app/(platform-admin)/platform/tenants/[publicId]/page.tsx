import { TenantDetailView } from '@/components/domain/platform/tenants/tenant-detail-view';

export default async function PlatformTenantDetailPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return <TenantDetailView publicId={publicId} />;
}
