import { PortalShell } from '@/components/redesign/portal/portal-shell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
