
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { PwaLoader } from '@/components/pwa-loader';
import { AppProvider } from '@/context/app-context';

export const metadata: Metadata = {
  title: 'Mini ALPS: Your Personal Knowledge Vault',
  description: 'Your personal knowledge vault, offline-first and ready for anything.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#D45715',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Fira+Code:wght@400;500&family=Inter:wght@400;500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'bg-background min-h-screen')}>
        <AppProvider>
          <PwaLoader />
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
