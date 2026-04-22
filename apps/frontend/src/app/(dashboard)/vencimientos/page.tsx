import { Suspense } from 'react';
import { VencimientosPage } from '@/components/vencimientos/vencimientos-page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VencimientosPage />
    </Suspense>
  );
}
