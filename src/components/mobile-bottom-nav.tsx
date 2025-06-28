'use client';

import { Anchor, Box, Eclipse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type View = 'spaces' | 'artifacts' | 'anchors';

interface MobileBottomNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  const navItems = [
    { name: 'artifacts' as View, label: 'Artifacts', icon: Box },
    { name: 'spaces' as View, label: 'Spaces', icon: Eclipse },
    { name: 'anchors' as View, label: 'Anchors', icon: Anchor },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-30 md:hidden">
      <nav className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className={cn(
              'flex flex-col items-center justify-center h-full w-full rounded-none px-2 text-muted-foreground transition-colors',
              activeView === item.name && 'text-primary'
            )}
            onClick={() => onViewChange(item.name)}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}
