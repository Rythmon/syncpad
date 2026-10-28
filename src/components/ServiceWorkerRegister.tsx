'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
