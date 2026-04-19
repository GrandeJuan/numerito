import { RedesignProtectedLayout } from '@/components/redesign';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RedesignProtectedLayout>{children}</RedesignProtectedLayout>;
}
