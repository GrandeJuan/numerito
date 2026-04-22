import { Suspense } from 'react';
import { EstudiosAdminPage } from '@/components/admin/estudios-page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EstudiosAdminPage />
    </Suspense>
  );
}
