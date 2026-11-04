import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SyncPad — Real-Time Collaborative Editor',
  description:
    'A distributed, conflict-free collaborative editor built with Yjs CRDTs, Redis Pub/Sub, and offline-first IndexedDB persistence.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#090a0d] text-zinc-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-200"
        suppressHydrationWarning
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
