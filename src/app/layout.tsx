import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SyncPad — Real-Time Collaborative Editor (CRDTs & Redis Pub/Sub)',
  description:
    'Distributed, conflict-free collaborative text editor for concurrent multi-user editing with Yjs CRDTs, Redis Pub/Sub, and offline-first IndexedDB synchronization.',
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
