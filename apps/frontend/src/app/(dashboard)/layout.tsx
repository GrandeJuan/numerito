import { ProtectedLayout } from '@/components/shared/protected-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
