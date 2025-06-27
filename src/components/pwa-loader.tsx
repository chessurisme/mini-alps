'use client';

import { useEffect } from 'react';

export function PwaLoader() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) =>
          console.log(
            'Service Worker registration successful with scope: ',
            reg.scope
          )
        )
        .catch((err) =>
          console.log('Service Worker registration failed: ', err)
        );
    }
  }, []);

  return null;
}
