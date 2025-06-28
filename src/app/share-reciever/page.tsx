
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ShareReceiverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { artifacts: artifactsContext } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    const shareId = searchParams.get('shareId');
    if (!shareId) {
      // No ID, maybe a direct navigation. Go home.
      router.replace('/');
      return;
    }

    const processShare = async () => {
      try {
        const cache = await caches.open('share-cache');
        const metaUrl = `/share-cache/${shareId}/meta`;
        const metaResponse = await cache.match(metaUrl);

        if (!metaResponse) {
          throw new Error('Share data not found in cache.');
        }

        const meta = await metaResponse.json();
        let itemsAdded = 0;

        // Handle files
        if (meta.files && meta.files.length > 0) {
          for (const fileInfo of meta.files) {
            const fileResponse = await cache.match(fileInfo.url);
            if (fileResponse) {
              const blob = await fileResponse.blob();
              const file = new File([blob], fileInfo.name, { type: fileInfo.type });
              await artifactsContext.addFromFile(file);
              itemsAdded++;
            }
          }
        } else if (meta.url) {
          // Handle URL (creates an article or note)
          await artifactsContext.add({
            title: meta.title || meta.text || meta.url,
            content: meta.url,
            type: 'note', // Will be converted to article by the editor logic
            source: meta.url,
            tags: [],
          });
          itemsAdded++;
        } else if (meta.text) {
          // Handle text (creates a note)
          await artifactsContext.add({
            title: meta.title || 'Shared Note',
            content: meta.text,
            type: 'note',
            tags: [],
          });
          itemsAdded++;
        }
        
        toast({
          title: 'Content Imported',
          description: `${itemsAdded} item(s) have been added to your vault.`,
        });
        
        // Clean up cache
        await cache.delete(metaUrl);
        if (meta.files) {
          for (const fileInfo of meta.files) {
            await cache.delete(fileInfo.url);
          }
        }

      } catch (error) {
        console.error('Failed to process share:', error);
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'Could not process the shared content.',
        });
      } finally {
        router.replace('/');
      }
    };

    processShare();
  }, [searchParams, router, artifactsContext, toast]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Importing shared content...</p>
    </div>
  );
}
