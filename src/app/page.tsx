'use client';

import { Suspense } from 'react';
import { AppProvider } from '@/context/app-context';
import MainView from '@/components/main-view';

export default function Home() {
  return (
    <AppProvider>
      <Suspense fallback={null}>
        <MainView />
      </Suspense>
    </AppProvider>
  );
}
