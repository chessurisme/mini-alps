
'use client';

import React from 'react';
import { Space } from '@/lib/types';
import { getContrastingTextColor } from '@/lib/color-utils';
import color from 'color-convert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SpaceCardProps {
  space: Space;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const FolderIcon = ({ baseColor, isSmart }: { baseColor: string, isSmart?: boolean }) => {
  const paperColor1 = `hsla(${color.hex.hsl(baseColor)[0]}, 15%, 95%, 0.8)`;
  const paperColor2 = `hsla(${color.hex.hsl(baseColor)[0]}, 25%, 90%, 0.7)`;
  const paperColor3 = `hsla(${color.hex.hsl(baseColor)[0]}, 35%, 85%, 0.6)`;

  return (
    <div className="relative w-full aspect-[4/3]">
      {/* Papers */}
      <div className="absolute w-[85%] h-[70%] top-[18%] left-[7.5%] rounded-lg" style={{ backgroundColor: paperColor3 }} />
      <div className="absolute w-[90%] h-[70%] top-[15%] left-[5%] rounded-lg" style={{ backgroundColor: paperColor2 }} />
      <div className="absolute w-[95%] h-[70%] top-1/4 left-[2.5%] rounded-lg" style={{ backgroundColor: paperColor1 }} />
      
      {/* Folder */}
      <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full" fill={baseColor} xmlns="http://www.w3.org/2000/svg">
        <path d="M5,10 H30 C32,10 33,11 35,13 L45,23 C47,25 48,25 50,25 H95 C97.761,25 100,27.239 100,30 V75 C100,77.761 97.761,80 95,80 H5 C2.239,80 0,77.761 0,75 V15 C0,12.239 2.239,10 5,10 Z" />
      </svg>
      {isSmart && (
        <div className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm rounded-full p-1.5">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
};


export function SpaceCard({ space, onClick, onEdit, onDelete }: SpaceCardProps) {
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trigger = e.currentTarget.querySelector('[data-radix-dropdown-menu-trigger]');
    if (trigger instanceof HTMLElement) {
      trigger.click();
    }
  };
  
  return (
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className="cursor-pointer group flex flex-col items-center transition-transform duration-300 ease-smooth hover:-translate-y-2 relative"
    >
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button data-radix-dropdown-menu-trigger className="hidden"></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Space</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Space</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <FolderIcon baseColor={space.color} isSmart={space.isSmart} />
      <h3 className="mt-2 font-semibold text-center text-muted-foreground group-hover:text-primary transition-colors">
        {space.name}
      </h3>
    </div>
  );
}
