
'use client';

import { Artifact } from '@/lib/types';
import { ArtifactCard } from './artifact-card';
import { HelpCircle } from 'lucide-react';

interface ArtifactGridProps {
  artifacts: Artifact[];
  onView: (artifact: Artifact) => void;
  onEdit: (artifact: Artifact) => void;
  onNavigate: (id: string) => void;
  onCreateNewSpace: () => void;
}

export function ArtifactGrid({ artifacts, onView, onEdit, onNavigate, onCreateNewSpace }: ArtifactGridProps) {
  if (artifacts.length === 0) {
    return (
        <div className="text-center text-muted-foreground mt-16">
            <p>Nothing here yet.</p>
            <p>Click the <HelpCircle className="inline-block h-4 w-4 align-middle" /> icon in the sidebar to learn how to get started.</p>
        </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {artifacts.map((artifact) => (
        <div key={artifact.id} className="mb-4 break-inside-avoid">
          <ArtifactCard 
            artifact={artifact} 
            onView={onView} 
            onEdit={onEdit} 
            onNavigate={onNavigate} 
            onCreateNewSpace={onCreateNewSpace}
          />
        </div>
      ))}
    </div>
  );
}
