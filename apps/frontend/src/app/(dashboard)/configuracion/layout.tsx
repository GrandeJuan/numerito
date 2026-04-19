import { ConfiguracionPage } from '@/components/configuracion/configuracion-page';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return <ConfiguracionPage>{children}</ConfiguracionPage>;
}
