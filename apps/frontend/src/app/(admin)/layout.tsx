import { AdminShell } from '@/components/redesign/admin/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
