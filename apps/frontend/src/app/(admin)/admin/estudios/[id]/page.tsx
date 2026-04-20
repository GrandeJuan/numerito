'use client';

import { useParams } from 'next/navigation';
import { EstudioDetailPage } from '@/components/admin/estudio-detail-page';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <EstudioDetailPage estudioId={id} />;
}
