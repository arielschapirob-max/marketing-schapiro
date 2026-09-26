import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PymeLegal — Diagnóstico de Protección de Datos',
  description: 'Generador inteligente de diagnósticos de protección de datos personales para Chile.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-screen bg-brand-50 font-sans antialiased">{children}</body>
    </html>
  );
}
