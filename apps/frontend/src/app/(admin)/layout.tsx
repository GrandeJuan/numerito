import { ProtectedLayout } from '@/components/shared/protected-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
