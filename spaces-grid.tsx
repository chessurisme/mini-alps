
'use client';

import { Space } from '@/lib/types';
import { SpaceCard } from './space-card';
import { HelpCircle } from 'lucide-react';

interface SpacesGridProps {
  spaces: Space[];
  onSpaceClick: (space: Space) => void;
  onEditSpace: (space: Space) => void;
  onDeleteSpace: (space: Space) => void;
}

export function SpacesGrid({ spaces, onSpaceClick, onEditSpace, onDeleteSpace }: SpacesGridProps) {
  if (spaces.length === 0) {
    return (
        <div className="text-center text-muted-foreground mt-16">
            <p>Nothing here yet.</p>
            <p>Click the <HelpCircle className="inline-block h-4 w-4 align-middle" /> icon in the sidebar to learn how to get started.</p>
        </div>
    );
  }
  
  return (
    <div 
      className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
    >
      {spaces.map((space) => (
        <div key={space.id}>
          <SpaceCard 
            space={space} 
            onClick={() => onSpaceClick(space)}
            onEdit={() => onEditSpace(space)}
            onDelete={() => onDeleteSpace(space)}
          />
        </div>
      ))}
    </div>
  );
}
