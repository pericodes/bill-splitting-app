import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AlertProvider } from '../components/common/AlertProvider';
import I18nProvider from '@/i18n/I18nProvider';

export const metadata: Metadata = {
  title: 'Bill Splitting App',
  description: 'Gestión financiera simple, rápida y confiable.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#026ffb',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f8f9fa] text-[#191c1d] min-h-screen antialiased" suppressHydrationWarning>
        <I18nProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
