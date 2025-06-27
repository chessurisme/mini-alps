
'use client';

import { useState, useEffect } from 'react';
import { Space } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddArtifactsToSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space | null;
}

export function AddArtifactsToSpaceDialog({ isOpen, onClose, space }: AddArtifactsToSpaceDialogProps) {
  const [artifactIds, setArtifactIds] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { spaces: spacesContext, artifacts: artifactsContext } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setArtifactIds('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const processIds = (idString: string): string[] => {
    return idString.split(/[\s,]+/).filter(id => id.trim() !== '');
  };

  const handleSave = async () => {
    if (!space || !artifactIds.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide at least one artifact ID.' });
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
    
    await spacesContext.addArtifactsToSpace(ids, space.id);
    toast({ title: 'Artifacts Added', description: `${ids.length} artifact(s) have been added to "${space.name}".`});

    setIsProcessing(false);
    onClose();
  };
  
  if (!space) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Artifacts to "{space.name}"</DialogTitle>
          <DialogDescription>
            Paste one or more artifact IDs below, separated by commas or spaces, to add them to this space.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            id="ids"
            value={artifactIds}
            onChange={(e) => setArtifactIds(e.target.value)}
            placeholder="Paste IDs..."
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Artifacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
