import { ProtectedLayout } from '@/components/shared/protected-layout';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
