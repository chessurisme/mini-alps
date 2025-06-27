
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Anchor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AnchorEditorProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: Anchor | null;
}

type DuplicatePromptAction = 'merge' | 'update' | null;

export function AnchorEditor({ isOpen, onClose, anchor }: AnchorEditorProps) {
  const [title, setTitle] = useState('');
  const [artifactIds, setArtifactIds] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateAnchor, setDuplicateAnchor] = useState<Anchor | null>(null);

  const { anchors: anchorsContext, artifacts: artifactsContext } = useAppContext();
  const { toast } = useToast();
  const isEditing = !!anchor;

  useEffect(() => {
    if (isOpen) {
      if (anchor) {
        setTitle(anchor.title);
        setArtifactIds(anchor.artifactIds.join(', '));
      } else {
        setTitle('');
        setArtifactIds('');
      }
      setIsProcessing(false);
      setDuplicateAnchor(null);
    }
  }, [isOpen, anchor]);

  const processIds = (idString: string): string[] => {
    return idString.split(/[\s,]+/).filter(id => id.trim() !== '');
  };

  const handleSave = async (duplicateAction: DuplicatePromptAction = null) => {
    if (!title.trim() || !artifactIds.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide both a title and at least one artifact ID.' });
      return;
    }
    setIsProcessing(true);

    const ids = processIds(artifactIds);
    const allArtifactIds = artifactsContext.all.map(a => a.id);
    const nonExistentIds = ids.filter(id => !allArtifactIds.includes(id));

    if (nonExistentIds.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Artifact ID(s)',
        description: `The following IDs do not exist: ${nonExistentIds.join(', ')}`,
      });
      setIsProcessing(false);
      return;
    }

    if (duplicateAction && duplicateAnchor) {
      const anchorToUpdateId = isEditing && anchor ? anchor.id : duplicateAnchor.id;
      if (duplicateAction === 'merge') {
        const combinedIds = [...new Set([...duplicateAnchor.artifactIds, ...ids])];
        await anchorsContext.update(anchorToUpdateId, { artifactIds: combinedIds });
        toast({ title: 'Anchor Merged', description: `Added new IDs to "${title}".` });
      } else if (duplicateAction === 'update') {
        await anchorsContext.update(anchorToUpdateId, { artifactIds: ids });
        toast({ title: 'Anchor Updated', description: `Replaced IDs for "${title}".` });
      }
    } else {
      const anchorData = { title: title.trim(), artifactIds: ids };
      const result = isEditing && anchor
        ? await anchorsContext.update(anchor.id, anchorData)
        : await anchorsContext.add(anchorData);

      if (result.success) {
        toast({ title: isEditing ? 'Anchor Updated' : 'Anchor Saved' });
      } else if (result.existing) {
        setDuplicateAnchor(result.existing);
        setIsProcessing(false);
        return;
      } else {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !duplicateAnchor} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Anchor' : 'Create New Anchor'}</DialogTitle>
            <DialogDescription>
              Anchors link a title to one or more artifact IDs for easy reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Zettelkasten Method"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="ids" className="text-right pt-2">Artifact IDs</label>
              <Textarea
                id="ids"
                value={artifactIds}
                onChange={(e) => setArtifactIds(e.target.value)}
                className="col-span-3"
                placeholder="Paste one or more IDs, separated by commas or spaces."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button onClick={() => handleSave()} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!duplicateAnchor} onOpenChange={(open) => !open && setDuplicateAnchor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Anchor Title</AlertDialogTitle>
            <AlertDialogDescription>
              An anchor with the title <span className="font-bold">"{duplicateAnchor?.title}"</span> already exists. How would you like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!justify-around gap-2 pt-4">
            <Button className="flex-1" variant="destructive" onClick={() => handleSave('update')}>Update</Button>
            <Button className="flex-1" variant="outline" onClick={() => handleSave('merge')}>Merge</Button>
            <AlertDialogCancel className="flex-1 mt-0" onClick={() => { setDuplicateAnchor(null); setIsProcessing(false); }}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
