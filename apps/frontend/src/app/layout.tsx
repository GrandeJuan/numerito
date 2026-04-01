import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Numerito — ERP Contable',
  description: 'ERP contable argentino para estudios contables',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
