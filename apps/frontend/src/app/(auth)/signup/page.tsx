import { Suspense } from 'react';
import { SignupPage } from '@/components/auth/signup-page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  );
}
