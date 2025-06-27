
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Dispatch, SetStateAction } from 'react';
import { Upload, Download, Anchor, Box, HelpCircle, Plus, Eclipse, Shield, Settings, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

type View = 'spaces' | 'artifacts' | 'anchors';

interface SidebarProps {
  activeView: View;
  setActiveView: Dispatch<SetStateAction<View>>;
  onImportClick: () => void;
  onExportClick: () => void;
  className?: string;
  isMobile?: boolean;
}

export function Sidebar({ activeView, setActiveView, onImportClick, onExportClick, className, isMobile = false }: SidebarProps) {
  const { toast } = useToast();

  const navItems = [
    { name: 'artifacts' as View, label: 'Artifacts', icon: Box },
    { name: 'spaces' as View, label: 'Spaces', icon: Eclipse },
    { name: 'anchors' as View, label: 'Anchors', icon: Anchor },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const charToCopy = '✱';
    navigator.clipboard.writeText(charToCopy);
    toast({
      title: 'Special Character Copied',
      description: `"${charToCopy}" copied to clipboard.`,
    });
  };

  const navItemContent = (item: typeof navItems[0]) => (
    <Button
      variant={activeView === item.name ? 'secondary' : 'ghost'}
      size={isMobile ? 'default' : 'icon'}
      onClick={() => setActiveView(item.name)}
      aria-label={item.label}
      className={cn(
        'rounded-lg transition-colors duration-300 ease-smooth',
        isMobile && 'w-full justify-start',
        activeView === item.name && 'text-primary'
      )}
    >
      <item.icon className="w-5 h-5" />
      {isMobile && <span className="ml-4 font-semibold">{item.label}</span>}
    </Button>
  );

  const bottomIconContent = (Icon: React.ElementType, label: string, dialogContent?: React.ReactNode, onClick?: () => void, fullScreen?: boolean) => (
    <Dialog>
      {isMobile ? (
        <DialogTrigger asChild>
          <Button variant="ghost" size="default" aria-label={label} className="w-full justify-start rounded-lg" onClick={onClick}>
            <Icon className="w-5 h-5" />
            <span className="ml-4 font-semibold">{label}</span>
          </Button>
        </DialogTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}><Icon className="w-5 h-5" /></Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right"><p>{label}</p></TooltipContent>
        </Tooltip>
      )}
      {dialogContent}
    </Dialog>
  );

  return (
    <TooltipProvider delayDuration={isMobile ? 99999 : 0}>
      <aside className={cn('flex flex-col items-center py-4', isMobile ? 'w-full px-2' : 'px-2', className)}>
        <a href="#" onClick={handleLogoClick} className={cn("flex items-center gap-2 text-primary", isMobile && 'self-start px-3 pb-4')}>
          <Box className="w-8 h-8" />
          {isMobile && <span className="text-xl font-display font-bold select-none text-primary italic">Mini ALPS</span>}
        </a>
        <nav className={cn("flex flex-col items-center gap-2", isMobile ? "w-full" : "mt-8")}>
          {navItems.map((item) => (
            <React.Fragment key={item.name}>
              {isMobile ? navItemContent(item) : (
                <Tooltip>
                  <TooltipTrigger asChild>{navItemContent(item)}</TooltipTrigger>
                  <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                </Tooltip>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex-grow" />
        
        <Separator className={cn(isMobile ? 'my-2' : 'my-4')} />

        <div className={cn("flex flex-col items-center gap-2", isMobile && "w-full")}>
            {bottomIconContent(HelpCircle, "Help", 
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
            )}

            {bottomIconContent(Shield, "Privacy & Data", 
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
            )}

            {bottomIconContent(Settings, "Settings",
              <DialogContent className="max-w-lg">
                  <DialogHeader>
                      <DialogTitle className="font-headline">Settings</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm space-y-6 max-h-[70vh] overflow-y-auto pr-4 pt-2">
                      <div>
                          <h4 className="font-semibold mb-2">Import & Export Data</h4>
                          <p className="text-sm text-muted-foreground mb-4">Save a backup of your entire vault or import one from a file.</p>
                          <div className="flex gap-4">
                              <Button variant="outline" className="flex-1" onClick={onImportClick}>
                                  <Upload className="mr-2 h-4 w-4" /> Import
                              </Button>
                              <Button variant="outline" className="flex-1" onClick={onExportClick}>
                                  <Download className="mr-2 h-4 w-4" /> Export
                              </Button>
                          </div>
                      </div>
                  </div>
              </DialogContent>
            )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
