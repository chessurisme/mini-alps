
'use client';

import { useState, useEffect, useRef } from 'react';
import { Space } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Tag, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface SpaceEditorProps {
  space?: Space | null;
  isOpen: boolean;
  onClose: () => void;
}

const PREDEFINED_COLORS = ['#e6194B', '#f58231', '#ffe119', '#bfef45', '#3cb44b', '#42d4f4', '#4363d8', '#911eb4', '#f032e6', '#e6beff', '#aaffc3', '#ffd8b1', '#ffffff', '#2a2a2a'];

export function SpaceEditor({ space, isOpen, onClose }: SpaceEditorProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PREDEFINED_COLORS[0]);
  const [isSmart, setIsSmart] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { spaces: spacesContext } = useAppContext();
  const { toast } = useToast();
  const isEditing = !!space;

  useEffect(() => {
    if (isOpen) {
      if (space) {
        setName(space.name);
        setColor(space.color);
        setIsSmart(space.isSmart || false);
        setTags(space.tags || []);
      } else {
        setName('');
        setColor(PREDEFINED_COLORS[Math.floor(Math.random() * (PREDEFINED_COLORS.length -2))]); // Avoid white/black as default
        setIsSmart(false);
        setTags([]);
        setCurrentTag('');
      }
      setIsProcessing(false);
    }
  }, [isOpen, space]);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim() !== '') {
      e.preventDefault();
      const newTag = currentTag.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    setIsProcessing(true);
    
    const spaceData = {
      name: name.trim(),
      color,
      isSmart,
      tags: isSmart ? tags : [],
    };

    if (isEditing && space) {
      await spacesContext.update(space.id, spaceData);
    } else {
      await spacesContext.add(spaceData);
    }
    
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Space' : 'Create New Space'}</DialogTitle>
          <DialogDescription>
            Spaces are like folders to organize your artifacts. They can even be smart!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Input
            id="name"
            placeholder="Space name (e.g., 'Project Phoenix')"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-7 gap-2">
            {PREDEFINED_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn("w-full aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 border", c === '#ffffff' && 'border-muted')}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className={cn("h-6 w-6", c === '#ffffff' ? 'text-black' : 'text-white')} />}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="smart-space" checked={isSmart} onCheckedChange={setIsSmart} />
            <Label htmlFor="smart-space" className="flex items-center gap-2">Enable Smart Space <Sparkles className="h-4 w-4 text-primary" /></Label>
          </div>

          {isSmart && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This space will automatically include any artifacts that have one of these tags.</p>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={tagInputRef}
                  placeholder="Add tags and press Enter..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleTagInput}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2 min-h-[26px]">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm py-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
