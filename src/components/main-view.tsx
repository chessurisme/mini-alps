
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppContext } from '@/context/app-context';
import { Sidebar } from '@/components/sidebar';
import { ArtifactGrid } from '@/components/artifact-grid';
import { AnchorPage } from '@/components/anchor-page';
import { SpacesGrid } from '@/components/spaces-grid';
import { ArtifactEditor } from '@/components/artifact-editor';
import { AnchorEditor } from '@/components/anchor-editor';
import { SpaceEditor } from '@/components/space-editor';
import { ArtifactViewer } from '@/components/artifact-viewer';
import { AddArtifactsToSpaceDialog } from '@/components/add-artifacts-to-space-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Plus, Search, Trash2, X, Binary, Edit, Box, Eclipse, Anchor as AnchorIcon, HelpCircle, Shield, Settings, Upload, Download } from 'lucide-react';
import { Artifact, Anchor, Space, ArtifactType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { matchDateTimePatterns, calculateDateRange } from '@/lib/date-parser';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Separator } from './ui/separator';
import { MobileBottomNav } from './mobile-bottom-nav';
import { ScrollArea } from './ui/scroll-area';


type View = 'spaces' | 'artifacts' | 'anchors';
const ARTIFACT_TYPES: ArtifactType[] = ['note', 'color', 'article', 'image', 'video', 'audio', 'quote', 'repo', 'file'];

const PLACEHOLDERS = [
  'Whisper a query to the digital void...',
  "Find that note about dreams...",
  "What lost memory shall we uncover?",
  "Search by title, content, or tag...",
  "Type 'yesterday' and press Enter...",
  "Search for #D45715...",
  "Type 'fav' to see your favorites",
  "Type 'trash' to see trashed items",
  "Type '\\show' to see hidden items",
  "Type 'image' to see all images",
  "I love you! I love you! I love you!",
  "Type a color, and see what memories bloom",
  "Look for lost thoughts in the fog...",
  'Remember those moments?',
];

const SKELETON_ASPECT_RATIOS = ['aspect-[4/3]', 'aspect-square', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[2/3]'];

export default function MainView() {
  const { 
    artifacts: artifactsContext,
    anchors: anchorsContext,
    spaces: spacesContext,
    importData, 
    exportData, 
    isLoading 
  } = useAppContext();
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<{ range: [Date, Date]; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [isDetonateDialogOpen, setDetonateDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [skeletonRatios, setSkeletonRatios] = useState<string[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Generate random aspect ratios for the skeleton loader only on the client
    const ratios = Array.from({ length: 15 }).map(() => 
      SKELETON_ASPECT_RATIOS[Math.floor(Math.random() * SKELETON_ASPECT_RATIOS.length)]
    );
    setSkeletonRatios(ratios);
  }, []);

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const activeView = (searchParams.get('view') as View) || 'artifacts';
  const activeSpaceId = searchParams.get('space');

  const viewingArtifactId = searchParams.get('viewingArtifact');
  const editingArtifactId = searchParams.get('editingArtifact');
  const isCreatingArtifact = searchParams.get('newArtifact') === 'true';
  const editingAnchorId = searchParams.get('editingAnchor');
  const isCreatingAnchor = searchParams.get('newAnchor') === 'true';
  const editingSpaceId = searchParams.get('editingSpace');
  const isCreatingSpace = searchParams.get('newSpace') === 'true';
  const isAddingToSpace = searchParams.get('addArtifactsToSpace') === 'true';

  const activeSpace = useMemo(() => spacesContext.all.find(s => s.id === activeSpaceId), [spacesContext.all, activeSpaceId]);
  const viewingArtifact = useMemo(() => artifactsContext.all.find(a => a.id === viewingArtifactId), [artifactsContext.all, viewingArtifactId]);
  const editingArtifact = useMemo(() => artifactsContext.all.find(a => a.id === editingArtifactId), [artifactsContext.all, editingArtifactId]);
  const editingAnchor = useMemo(() => anchorsContext.all.find(a => a.id === editingAnchorId), [anchorsContext.all, editingAnchorId]);
  const editingSpace = useMemo(() => spacesContext.all.find(s => s.id === editingSpaceId), [spacesContext.all, editingSpaceId]);
  
  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  }, []);

  const DETONATE_KEYWORD = '✱ steal all artifacts ✱';

  useEffect(() => { if (searchQuery === DETONATE_KEYWORD) setDetonateDialogOpen(true); }, [searchQuery]);

  const updateQuery = (newParams: Record<string, string | null>, clear: string[] = []) => {
    const params = new URLSearchParams(searchParams.toString());
    clear.forEach(p => params.delete(p));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCloseAllDialogs = () => router.back();

  const handleDetonateConfirm = async () => {
    await artifactsContext.deleteAll();
    setSearchQuery('');
    setDetonateDialogOpen(false);
  };

  const handleDetonateCancel = () => {
    setSearchQuery('');
    setDetonateDialogOpen(false);
  };

  const handleEditArtifact = (artifact: Artifact) => updateQuery({ editingArtifact: artifact.id }, ['viewingArtifact']);
  const handleEditAnchor = (anchor: Anchor) => updateQuery({ editingAnchor: anchor.id });
  const handleEditSpace = (space: Space) => updateQuery({ editingSpace: space.id });
  
  const handleView = (artifact: Artifact) => updateQuery({ viewingArtifact: artifact.id });
  const handleTagClick = (tag: string) => { setSearchQuery(tag); updateQuery({ view: 'artifacts', space: null }); };

  const handleNavigate = (artifactId: string) => {
    const targetArtifact = artifactsContext.all.find(a => a.id === artifactId);
    if (targetArtifact) updateQuery({ viewingArtifact: artifactId });
    else toast({ variant: "destructive", title: "Not Found", description: `Artifact with ID "${artifactId}" could not be found.` });
  };
  
  const handleCreateNewArtifact = () => updateQuery({ newArtifact: 'true' });
  const handleCreateNewAnchor = () => updateQuery({ newAnchor: 'true' });
  const handleCreateNewSpace = () => updateQuery({ newSpace: 'true' });
  
  const handleAddByIdClick = () => updateQuery({ addArtifactsToSpace: 'true' });
  
  const handleFabClick = () => {
    if (activeView === 'spaces' && !activeSpace) handleCreateNewSpace();
    else if (activeView === 'anchors') handleCreateNewAnchor();
    else handleCreateNewArtifact();
  };

  const handleDeleteSpaceConfirm = async () => {
    if (spaceToDelete) {
      await spacesContext.delete(spaceToDelete.id);
      updateQuery({ view: 'spaces', space: null });
      setSpaceToDelete(null);
    }
  };

  const emptyArtifactTrash = async () => {
    const trash = artifactsContext.all.filter(a => a.isTrashed);
    for(const artifact of trash) await artifactsContext.delete(artifact.id);
  };
  
  const emptyAnchorTrash = async () => {
    const trash = anchorsContext.all.filter(a => a.isTrashed);
    for(const anchor of trash) await anchorsContext.delete(anchor.id);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const potentialTimeQuery = searchQuery.trim();
      if (!potentialTimeQuery) return;
      const timeMatch = matchDateTimePatterns(potentialTimeQuery);
      if (timeMatch && timeMatch.length > 0) {
        const range = calculateDateRange(timeMatch[0]);
        if (range) {
          setTimeFilter({ range, text: potentialTimeQuery });
          setSearchQuery('');
        }
      }
    }
  };
  
  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filteredArtifacts = useMemo(() => {
    let basePool: Artifact[];

    if (activeSpace) {
      if (activeSpace.isSmart && activeSpace.tags && activeSpace.tags.length > 0) {
        basePool = artifactsContext.all.filter(artifact => 
          activeSpace.tags!.some(spaceTag => (artifact.tags || []).includes(spaceTag))
        );
      } else {
        basePool = artifactsContext.all.filter(a => a.spaceId === activeSpace.id);
      }
    } else if (activeView === 'artifacts') {
      basePool = artifactsContext.all;
    } else {
      basePool = [];
    }
    
    let result: Artifact[];

    if (normalizedSearch === '\\show') result = basePool.filter(a => a.isHidden);
    else if (normalizedSearch === 'trash') result = basePool.filter(a => a.isTrashed);
    else result = basePool.filter(a => !a.isTrashed && !a.isHidden);

    if (timeFilter) {
      const [startDate, endDate] = timeFilter.range;
      result = result.filter(a => { const artifactDate = new Date(a.createdAt); return artifactDate >= startDate && artifactDate <= endDate; });
    }
    
    const keywordSearch = (normalizedSearch !== 'trash' && normalizedSearch !== '\\show') ? normalizedSearch : '';

    if (keywordSearch) {
      const isSearchByType = ARTIFACT_TYPES.includes(keywordSearch as ArtifactType);
      const isNumericIdSearch = /^\d+$/.test(keywordSearch);
      
      if (isNumericIdSearch && keywordSearch.length >= 4) {
         result = result.filter(a => a.id.startsWith(keywordSearch));
      }
      else if (keywordSearch === 'favorites' || keywordSearch === 'fav') result = result.filter(a => a.isFavorited);
      else if (isSearchByType) result = result.filter(a => a.type === keywordSearch);
      else result = result.filter(a => (a.title && a.title.toLowerCase().includes(keywordSearch)) || (a.content && a.content.toLowerCase().includes(keywordSearch)) || (a.tags && a.tags.some(t => t.toLowerCase().includes(keywordSearch))));
    }

    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [artifactsContext.all, normalizedSearch, timeFilter, activeSpace, activeView]);

  const filteredAnchors = useMemo(() => {
    let result: Anchor[];
    if (normalizedSearch === 'trash') result = anchorsContext.all.filter(a => a.isTrashed);
    else result = anchorsContext.all.filter(a => !a.isTrashed);
    
    const keywordSearch = normalizedSearch !== 'trash' ? normalizedSearch : '';
    if (keywordSearch) result = result.filter(anchor => anchor.title.toLowerCase().includes(keywordSearch) || anchor.artifactIds.some(id => id.includes(keywordSearch)));

    return result.sort((a,b) => a.title.localeCompare(b.title));
  }, [anchorsContext.all, normalizedSearch]);

  const filteredSpaces = useMemo(() => {
      if (!normalizedSearch) return spacesContext.all;
      return spacesContext.all.filter(s => s.name.toLowerCase().includes(normalizedSearch));
  }, [spacesContext.all, normalizedSearch]);

  const searchPlaceholder = useMemo(() => {
    if (activeView === 'anchors') return 'Search anchors by title or ID...';
    if (activeView === 'spaces' && !activeSpace) return 'Search spaces...';
    return placeholder;
  }, [activeView, activeSpace, placeholder]);

  const artifactsInTrashCount = useMemo(() => artifactsContext.all.filter(a => a.isTrashed).length, [artifactsContext.all]);
  const anchorsInTrashCount = useMemo(() => anchorsContext.all.filter(a => a.isTrashed).length, [anchorsContext.all]);
  
  const renderHeaderTitle = () => {
    if (activeSpace) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto -ml-2 text-2xl font-display font-bold hover:bg-accent cursor-pointer">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: activeSpace.color }} />
              <span>{activeSpace.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleEditSpace(activeSpace)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Space</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSpaceToDelete(activeSpace)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Space</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  
    const handleClick = (view: View) => {
      updateQuery({ view: view, space: null });
    };

    switch(activeView) {
      case 'spaces':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-2xl font-display font-bold select-none text-primary cursor-pointer" onClick={() => handleClick('spaces')}>
                  Spaces
                </h1>
              </TooltipTrigger>
              <TooltipContent><p>Spaces are like folders for organizing your artifacts.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'anchors':
         return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-2xl font-display font-bold select-none text-primary cursor-pointer" onClick={() => handleClick('anchors')}>
                  Anchors
                </h1>
              </TooltipTrigger>
              <TooltipContent><p>Anchors link a title to one or more artifact IDs for easy reference.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'artifacts':
      default:
        return (
           <h1 className="text-2xl font-display font-bold select-none text-primary cursor-pointer" onClick={() => handleClick('artifacts')}>
             Artifacts
           </h1>
        );
    }
  }

  const renderSkeletonGrid = () => (
    <div className="p-4 sm:p-6 lg:p-8 columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {(skeletonRatios.length > 0 ? skeletonRatios : Array(15).fill(SKELETON_ASPECT_RATIOS[0])).map((aspectRatio, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <Skeleton className={cn("w-full rounded-lg", aspectRatio)} />
        </div>
      ))}
    </div>
  );
  
  const renderInitialSkeleton = () => (
    <div className="p-4 sm:p-6 lg:p-8 columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <Skeleton className={cn("w-full rounded-lg", SKELETON_ASPECT_RATIOS[i % SKELETON_ASPECT_RATIOS.length])} />
        </div>
      ))}
    </div>
  );


  if (!isMounted) {
    return (
      <div className="flex h-screen bg-background">
        <aside className={cn('hidden md:flex flex-col items-center py-4', 'px-2')}>
          <a href="#" className={cn("flex items-center gap-2 text-primary")}>
            <Box className="w-8 h-8" />
          </a>
          <nav className={cn("flex flex-col items-center gap-2", "mt-8")}>
            <Button variant={'secondary'} size={'icon'} className={cn('rounded-lg', 'text-primary')}>
              <Box className="w-5 h-5" />
            </Button>
            <Button variant={'ghost'} size={'icon'} className={'rounded-lg'}>
              <Eclipse className="w-5 h-5" />
            </Button>
            <Button variant={'ghost'} size={'icon'} className={'rounded-lg'}>
              <AnchorIcon className="w-5 h-5" />
            </Button>
          </nav>
          <div className="flex-grow" />
          <Separator className={'my-4'} />
          <div className={cn("flex flex-col items-center gap-2")}>
              <Button variant="ghost" size="icon"><HelpCircle className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><Shield className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b shrink-0 gap-2 md:gap-4">
             <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold select-none text-primary cursor-pointer">
                  Artifacts
                </h1>
             </div>
            <div className="flex items-center gap-2 flex-grow justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={placeholder} className="pl-9" value="" readOnly />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" className="hidden"/>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto relative">
            {renderInitialSkeleton()}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => updateQuery({ view: view, space: null })} 
          onImportClick={() => fileInputRef.current?.click()} 
          onExportClick={exportData} 
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b shrink-0 gap-2 md:gap-4">
           <div className="flex items-center gap-2">
             {isMobile && <a href="#" className="text-primary -ml-2"><Box className="w-8 h-8" /></a>}
             {(!isMobile || (!searchQuery.trim() && !timeFilter)) && renderHeaderTitle()}
           </div>
          <div className="flex items-center gap-2 flex-grow justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={timeFilter ? `Searching in "${timeFilter.text}"` : searchPlaceholder} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
            </div>
             {timeFilter && (activeView !== 'anchors') && (
              <Badge variant="secondary" className="whitespace-nowrap">{timeFilter.text}<button onClick={() => setTimeFilter(null)} className="ml-2 rounded-full hover:bg-muted p-0.5 -mr-1"><X className="h-3 w-3" /></button></Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeSpace && (
              <TooltipProvider>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleAddByIdClick} variant="outline" size="icon"><Binary className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Add by ID</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button onClick={handleCreateNewArtifact} variant="default" size="icon">
                              <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>New Artifact</p></TooltipContent>
                    </Tooltip>
                </div>
              </TooltipProvider>
            )}
            {normalizedSearch === 'trash' && (activeView !== 'anchors') && artifactsInTrashCount > 0 && (<Button variant="destructive" onClick={emptyArtifactTrash}><Trash2 className="mr-2 h-4 w-4" /> Empty Trash</Button>)}
            {normalizedSearch === 'trash' && activeView === 'anchors' && anchorsInTrashCount > 0 && (<Button variant="destructive" onClick={emptyAnchorTrash}><Trash2 className="mr-2 h-4 w-4" /> Empty Anchor Trash</Button>)}
            <input type="file" ref={fileInputRef} onChange={(e) => { e.target.files && importData(e.target.files[0])} } className="hidden" accept=".json"/>
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-lg p-4 h-auto">
                    <div className="grid gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" className="w-full justify-start text-base py-6"><HelpCircle className="mr-4"/> Help & Guide</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-full w-full h-full flex flex-col p-0 gap-0 border-0">
                          <DialogHeader className="p-4 border-b flex flex-row items-center">
                            <DialogTitle className="font-headline text-lg">Quick Guide</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-grow">
                            <div className="text-sm space-y-6 max-h-full p-8 prose dark:prose-invert max-w-4xl mx-auto">
                                <div className="space-y-2">
                                  <h4 className="font-bold">Spaces</h4>
                                  <p className="text-muted-foreground">Spaces are like folders for organizing your artifacts. Navigate to the Spaces view from the sidebar to see all your spaces. Click the <Plus className="inline h-4 w-4" /> button to create a new one. To make a space "smart", add tags to it in the Space Editor, and it will automatically collect any artifacts with those tags.</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold">Searching</h4>
                                  <p className="text-muted-foreground">Use the search bar to find anything. Your search will apply to the current view (e.g., searching within a Space, across all artifacts, or through your Anchors).</p>
                                  <h5 className="font-semibold pt-2 text-foreground">Special Keywords</h5>
                                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    <li><code className="bg-muted px-1 py-0.5 rounded text-foreground">trash</code> to view trashed items.</li>
                                    <li><code className="bg-muted px-1 py-0.5 rounded text-foreground">fav</code> or <code className="bg-muted px-1 py-0.5 rounded text-foreground">favorites</code> to view your favorites.</li>
                                    <li><code className="bg-muted px-1 py-0.5 rounded text-foreground">\show</code> to view hidden artifacts.</li>
                                    <li>A type name like <code className="bg-muted px-1 py-0.5 rounded text-foreground">note</code>, <code className="bg-muted px-1 py-0.5 rounded text-foreground">image</code>, or <code className="bg-muted px-1 py-0.5 rounded text-foreground">article</code> to filter by type.</li>
                                  </ul>
                                  <h5 className="font-semibold pt-2 text-foreground">Time-Travel Search</h5>
                                  <p className="text-muted-foreground">Search for artifacts from a specific time. Type a date or timeframe into the search bar and press <strong>Enter</strong>.</p>
                                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    <li>Examples: <code className="bg-muted px-1 py-0.5 rounded text-foreground">yesterday</code>, <code className="bg-muted px-1 py-0.5 rounded text-foreground">last week</code>, <code className="bg-muted px-1 py-0.5 rounded text-foreground">February 2024</code>, <code className="bg-muted px-1 py-0.5 rounded text-foreground">20240728</code>.</li>
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold pt-2">Creating Artifacts</h4>
                                  <p className="text-muted-foreground">Click the main <Plus className="inline h-4 w-4" /> button to create an artifact. To add to a space, go into that space first, or assign it from the editor.</p>
                                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    <li><strong>Paste a URL</strong> (e.g., <code className="bg-muted px-1 py-0.5 rounded text-foreground">example.com</code>) to automatically import an article or a YouTube video.</li>
                                    <li><strong>Paste a hex code</strong> (e.g., <code className="bg-muted px-1 py-0.5 rounded text-foreground">#D45715</code>) to create a color swatch.</li>
                                    <li><strong>Write a note</strong> with Markdown support.</li>
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold pt-2">Anchors & Wiki Links</h4>
                                  <p className="text-muted-foreground">Create connections between your ideas using two powerful methods:</p>
                                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    <li><strong>Anchors:</strong> Use the "Anchors" page to create named references that link to one or more artifacts. This is great for managing topics or projects.</li>
                                    <li><strong>Wiki Links:</strong> Directly link between artifacts by typing <code className="bg-muted px-1 py-0.5 rounded text-foreground">[[artifact-id]]</code> in a note's content.</li>
                                  </ul>
                                </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" className="w-full justify-start text-base py-6"><Shield className="mr-4"/> Privacy & Data</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-full w-full h-full flex flex-col p-0 gap-0 border-0">
                            <DialogHeader className="p-4 border-b flex flex-row items-center">
                              <DialogTitle className="font-headline text-lg">Privacy & Data Management</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="flex-grow">
                              <div className="text-sm space-y-8 max-h-full p-8 prose dark:prose-invert max-w-4xl mx-auto">
                                  <div className="space-y-2">
                                      <h4 className="font-bold flex items-center gap-2"><Shield className="w-4 h-4"/> Privacy First</h4>
                                      <p className="text-muted-foreground">All your data is stored locally in your browser's IndexedDB. Nothing is sent to any server. You have full control. Use the Import/Export buttons in Settings at any time to back up or move your data.</p>
                                  </div>
                                  <div className="pt-6">
                                      <h4 className="font-semibold text-destructive mb-2">Danger Zone</h4>
                                      <p className="text-sm text-muted-foreground">To permanently delete all data in your vault, type the following phrase into the main search bar and press Enter:</p>
                                      <code className="block text-center bg-muted text-destructive font-mono p-3 rounded-md mt-2">✱ steal all artifacts ✱</code>
                                  </div>
                              </div>
                            </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Separator className="my-1"/>
                      <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => fileInputRef.current?.click()}><Upload className="mr-4"/> Import from file</Button>
                      <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={exportData}><Download className="mr-4"/> Export to file</Button>
                    </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative pb-16 md:pb-0">
          {isLoading ? (
            renderSkeletonGrid()
          ) : (
            <>
              {activeView === 'spaces' && !activeSpace && <SpacesGrid spaces={filteredSpaces} onSpaceClick={(space) => updateQuery({space: space.id})} onEditSpace={handleEditSpace} onDeleteSpace={setSpaceToDelete} />}
              {(activeView === 'artifacts' || activeSpace) && <ArtifactGrid artifacts={filteredArtifacts} onView={handleView} onEdit={handleEditArtifact} onNavigate={handleNavigate} onCreateNewSpace={handleCreateNewSpace} />}
              {activeView === 'anchors' && <AnchorPage anchors={filteredAnchors} artifacts={artifactsContext.all} onViewArtifact={handleView} onEditAnchor={handleEditAnchor} />}
            </>
          )}
          {!activeSpace && (
            <Button onClick={handleFabClick} className="bg-primary hover:bg-primary/90 rounded-full h-14 w-14 fixed bottom-20 right-8 md:bottom-8 shadow-lg z-20">
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </div>
      </main>
      
      <ArtifactEditor isOpen={isCreatingArtifact || !!editingArtifact} onClose={handleCloseAllDialogs} artifact={editingArtifact} activeSpaceId={activeSpace?.id} />
      <AnchorEditor isOpen={isCreatingAnchor || !!editingAnchor} onClose={handleCloseAllDialogs} anchor={editingAnchor} />
      <SpaceEditor isOpen={isCreatingSpace || !!editingSpace} onClose={handleCloseAllDialogs} space={editingSpace} />
      <AddArtifactsToSpaceDialog isOpen={isAddingToSpace} onClose={handleCloseAllDialogs} space={activeSpace} />
      
      <ArtifactViewer isOpen={!!viewingArtifact} onClose={handleCloseAllDialogs} artifact={viewingArtifact} onEdit={handleEditArtifact} onNavigate={handleNavigate} onTagClick={handleTagClick} />
      
      <AlertDialog open={isDetonateDialogOpen} onOpenChange={setDetonateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Detonation Confirmation</AlertDialogTitle><AlertDialogDescription>This action is irreversible and will permanently delete all artifacts. Are you sure you want to proceed?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={handleDetonateCancel}>Cancel</AlertDialogCancel><AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDetonateConfirm}>Detonate All Artifacts</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!spaceToDelete} onOpenChange={(open) => !open && setSpaceToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete Space: "{spaceToDelete?.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will remove the space but its artifacts will not be deleted. They will become unassigned. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSpaceConfirm} className={buttonVariants({ variant: "destructive" })}>
                      Delete Space
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {isMobile && <MobileBottomNav activeView={activeView} onViewChange={(view) => updateQuery({ view: view, space: null })} />}
    </div>
  );
}

