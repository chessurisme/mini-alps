
'use client';

import { Anchor, Artifact } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { Edit, Trash2, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

interface AnchorPageProps {
  anchors: Anchor[];
  artifacts: Artifact[];
  onViewArtifact: (artifact: Artifact) => void;
  onEditAnchor: (anchor: Anchor) => void;
}

export function AnchorPage({ anchors, artifacts, onViewArtifact, onEditAnchor }: AnchorPageProps) {
  const { toast } = useToast();
  const { anchors: anchorsContext } = useAppContext();

  const groupedAnchors = anchors.reduce((acc, anchor) => {
    if (!anchor.title) return acc;
    const firstLetter = anchor.title.charAt(0).toUpperCase();
    const group = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(anchor);
    return acc;
  }, {} as Record<string, Anchor[]>);

  const sortedGroups = Object.keys(groupedAnchors).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });

  const handleArtifactClick = (artifactId: string) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    if (artifact) {
      onViewArtifact(artifact);
    } else {
      toast({
        variant: "destructive",
        title: "Artifact not found",
        description: `Could not find artifact with ID: ${artifactId}`,
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {anchors.length === 0 ? (
        <div className="text-center text-muted-foreground mt-16">
            <p>Nothing here yet.</p>
            <p>Click the <HelpCircle className="inline-block h-4 w-4 align-middle" /> icon in the sidebar to learn how to get started.</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={sortedGroups} className="w-full">
          {sortedGroups.map((group) => (
            <AccordionItem key={group} value={group} className="border-b-0 mb-4">
              <AccordionTrigger className="text-2xl font-headline font-bold py-2 border-b hover:no-underline">
                {group}
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-3">
                {groupedAnchors[group]
                  .sort((a,b) => a.title.localeCompare(b.title))
                  .map((anchor) => (
                    <div key={anchor.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-1">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="link" className="font-semibold text-base flex-1 justify-start p-0 h-auto text-foreground hover:text-primary !no-underline hover:!underline">
                                {anchor.title}
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => onEditAnchor(anchor)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => anchorsContext.toggleState(anchor.id, 'isTrashed')} className={anchor.isTrashed ? '' : 'text-destructive focus:text-destructive'}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>{anchor.isTrashed ? 'Restore' : 'Trash'}</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex flex-col items-start sm:items-end gap-1">
                        {anchor.artifactIds.map(id => (
                          <span 
                            key={id}
                            className="font-code text-primary cursor-pointer hover:underline text-sm"
                            onClick={() => handleArtifactClick(id)}
                          >
                            #{id}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
