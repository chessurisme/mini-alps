'use client';

import { Suspense } from 'react';
import MainView from '@/components/main-view';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainView />
    </Suspense>
  );
}
