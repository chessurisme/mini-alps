
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Artifact, ArtifactType } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Tag, Loader2, Paperclip, Maximize, Minimize, Undo, Redo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeID, getYouTubeThumbnail, getYouTubeTitle } from '@/lib/youtube';
import { MilkdownEditor, type MilkdownEditorHandles } from './milkdown-editor';
import { colors } from '@/lib/color-names';
import { findClosestColor } from '@/lib/color-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface ArtifactEditorProps {
  artifact?: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
  activeSpaceId?: string;
}

const HEX_COLOR_REGEX = /^#([0-9A-F]{3}){1,2}$/i;
const QUOTE_REGEX = /^(“|").*("”|")$/s;
function isGitHubRepoURL(url: string): boolean { try { const u = new URL(url); if (u.hostname !== 'github.com') return false; const parts = u.pathname.split('/').filter(Boolean); return parts.length === 2; } catch { return false; } }

const DRAFT_KEY = 'mini-alps-new-artifact-draft';

export function ArtifactEditor({ artifact, isOpen, onClose, activeSpaceId }: ArtifactEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [spaceId, setSpaceId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTagInputExpanded, setIsTagInputExpanded] = useState(false);
  const [isSmartSpace, setIsSmartSpace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const editorRef = useRef<MilkdownEditorHandles>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const { spaces: spacesContext, artifacts: artifactsContext } = useAppContext();
  const { toast } = useToast();

  const isReadonlyEditor = !artifact ? false : (['image', 'video', 'audio', 'color', 'file', 'repo', 'article'].includes(artifact.type));

  const toEditableContent = (rawContent: string): string => {
    if (!rawContent) return '';
    return rawContent.replace(/\[#([a-zA-Z0-9-._~]+)\]\(wm:\/\/open\/\1\)/g, '[[$1]]');
  }

  const toSavableContent = (editableContent: string): string => {
    if (!editableContent) return '';
    // First, undo any escaping that Milkdown might have added to brackets.
    const unescapedContent = editableContent.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    // Then, convert the simple [[id]] syntax to a proper Markdown link, allowing for whitespace.
    return unescapedContent.replace(/\[\[\s*([a-zA-Z0-9-._~]+)\s*\]\]/g, (_match, artifactId) => {
        return `[#${artifactId}](wm://open/${artifactId})`;
    });
  }

  const handleUndo = () => editorRef.current?.undo();
  const handleRedo = () => editorRef.current?.redo();

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsFullScreen(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isFullScreen) {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      setIsUiVisible(false);
      uiTimeoutRef.current = setTimeout(() => {
        setIsUiVisible(true);
      }, 1500);
    }
    return () => {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    }
  }, [title, content, isFullScreen]);
  
  useEffect(() => {
    if (!isFullScreen) {
      setIsUiVisible(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    }
  }, [isFullScreen]);

  useEffect(() => {
    if (isOpen) {
      const activeSpace = spacesContext.all.find(s => s.id === activeSpaceId);
      setIsSmartSpace(!!(activeSpace && activeSpace.isSmart));
      
      if (artifact) { // Editing existing artifact
        setTitle(artifact.title || '');
        setContent(toEditableContent(artifact.content || ''));
        setTags(artifact.tags || []);
        setSpaceId(artifact.spaceId);
      } else { // Creating new artifact
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const { title: draftTitle, content: draftContent, tags: draftTags } = JSON.parse(savedDraft);
                setTitle(draftTitle || '');
                setContent(draftContent || ''); // Drafts are already in editable format
                setTags(draftTags || []);
            } else {
                setTitle('');
                setContent('');
                if (activeSpace && activeSpace.isSmart && activeSpace.tags?.length) {
                  setTags([activeSpace.tags[0]]);
                } else {
                  setTags([]);
                }
            }
        } catch (e) { console.error("Could not load draft", e); }
        
        setCurrentTag('');
        setSpaceId(activeSpaceId);
      }
      setIsProcessing(false);
      setIsTagInputExpanded(false);
    }
  }, [artifact, isOpen, activeSpaceId, spacesContext.all]);

  useEffect(() => {
      // Auto-save draft for new artifacts
      if (isOpen && !artifact) {
          const draft = { title, content, tags };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
  }, [title, content, tags, isOpen, artifact]);

  useEffect(() => { if (isTagInputExpanded) tagInputRef.current?.focus(); }, [isTagInputExpanded]);

  const handleDelayedClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose(); // this is router.back()
    }, 200); // Corresponds to animation duration
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };
  const removeTag = (tagToRemove: string) => setTags(tags.filter((tag) => tag !== tagToRemove));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      await artifactsContext.addFromFile(file, spaceId, tags);
      localStorage.removeItem(DRAFT_KEY);
      handleDelayedClose();
    }
  };

  const handleSave = useCallback(async () => {
    const processedContent = content.trim();
    if (!processedContent && !title.trim() && artifact?.type !== 'image' && artifact?.type !== 'video' && artifact?.type !== 'audio' && artifact?.type !== 'file' && artifact?.type !== 'repo' && artifact?.type !== 'color') { handleDelayedClose(); return; }
    
    setIsProcessing(true);
    
    const artifactBaseData = { title: title.trim(), tags, spaceId: spaceId === 'none' ? undefined : spaceId };

    // --- Start of type detection for NEW artifacts ---
    if (!artifact) {
        // Un-escape characters that Milkdown might have escaped before pattern matching.
        const detectionContent = processedContent.replace(/\\([^\w\s])/g, '$1');

        const isColor = HEX_COLOR_REGEX.test(detectionContent);
        if (isColor) {
            let finalTitle = title.trim();
            if (!finalTitle) {
                const exactMatch = colors.find((c: any) => c.hex.toLowerCase() === detectionContent.toLowerCase());
                if (exactMatch) finalTitle = exactMatch.name;
                else { const closestColor = findClosestColor(detectionContent); if (closestColor) finalTitle = closestColor.name; }
            }
            await artifactsContext.add({ ...artifactBaseData, title: finalTitle || detectionContent, content: detectionContent, type: 'color' });
            localStorage.removeItem(DRAFT_KEY);
            setIsProcessing(false); handleDelayedClose(); return;
        }
        
        const isQuote = QUOTE_REGEX.test(detectionContent);
        if(isQuote) {
           await artifactsContext.add({ ...artifactBaseData, content: detectionContent.replace(/^(“|")/, '').replace(/("”|")$/, '').trim(), type: 'quote' });
           toast({ title: "Quote Saved" });
           localStorage.removeItem(DRAFT_KEY);
           setIsProcessing(false); handleDelayedClose(); return;
        }

        const isGithubRepo = isGitHubRepoURL(detectionContent);
        if (isGithubRepo) {
            const url = new URL(detectionContent);
            const repoPath = url.pathname.substring(1);
            const repoName = repoPath.split('/')[1] || repoPath;
            const readmeUrls = [`https://raw.githubusercontent.com/${repoPath}/main/README.md`, `https://raw.githubusercontent.com/${repoPath}/master/README.md`];
            let readmeContent: string | null = null;
            for (const readmeUrl of readmeUrls) { try { const response = await fetch(readmeUrl); if (response.ok) { readmeContent = await response.text(); break; } } catch (e) { /* Ignore */ } }
            await artifactsContext.add({ ...artifactBaseData, title: title.trim() || repoName, content: readmeContent || `Could not fetch README for ${repoPath}.`, source: detectionContent, type: 'repo' });
            toast({ title: "GitHub Repo Saved", description: readmeContent ? "Successfully imported README." : "Could not find README." });
            localStorage.removeItem(DRAFT_KEY);
            setIsProcessing(false); handleDelayedClose(); return;
        }

        const youtubeVideoId = extractYouTubeID(detectionContent);
        if (youtubeVideoId) {
          const thumbnailUrl = await getYouTubeThumbnail(detectionContent);
          const videoTitle = await getYouTubeTitle(detectionContent);
          await artifactsContext.add({ ...artifactBaseData, title: videoTitle || title.trim() || 'YouTube Video', content: `https://www.youtube.com/watch?v=${youtubeVideoId}`, type: 'video', source: detectionContent, leadImageUrl: thumbnailUrl || '' });
          toast({ title: "YouTube Video Saved" });
          localStorage.removeItem(DRAFT_KEY);
          setIsProcessing(false); handleDelayedClose(); return;
        }
        
        const isUrlLike = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/.test(detectionContent) && detectionContent.split(/\s+/).length === 1;

        if (isUrlLike) { // Already checked for github/youtube
            const originalUrl = detectionContent.startsWith('http') ? detectionContent : `https://${detectionContent}`;
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await artifactsContext.add({ ...artifactBaseData, content: originalUrl, type: 'note', source: originalUrl, meta: { needsArticleExtraction: true } });
                toast({ title: "You're offline", description: "Link saved. It will be imported when you're back online." });
                localStorage.removeItem(DRAFT_KEY);
                setIsProcessing(false); handleDelayedClose(); return;
            }
            try {
                let urlForExtraction = originalUrl;
                try { 
                    const urlObject = new URL(originalUrl); 
                    if (urlObject.hostname.endsWith('medium.com')) {
                        urlForExtraction = `https://freedium.cfd/${urlObject.hostname}${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
                    }
                } catch (e) { 
                    console.warn("Could not parse URL for Medium check, proceeding with original.", e); 
                }

                const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlForExtraction }) });
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to extract article'); }
                const articleData = await response.json();

                await artifactsContext.add({ ...artifactBaseData, title: articleData.title || title.trim(), content: articleData.content, type: 'article', source: originalUrl, leadImageUrl: articleData.lead_image_url });
                toast({ title: "Article Imported" });
            } catch (error: any) {
                console.error("Failed to extract article", error);
                toast({ variant: "destructive", title: "Article Import Failed", description: error.message || "Could not fetch content. Saving as a regular note." });
                await artifactsContext.add({ ...artifactBaseData, content: originalUrl, type: 'note', source: originalUrl });
            } finally { 
                localStorage.removeItem(DRAFT_KEY); 
                setIsProcessing(false); 
                handleDelayedClose(); 
            }
            return;
        }
    }
    // --- End of type detection ---
    
    // If we are here, it's either an update, or a new 'note' artifact.
    // Process wiki links for saving.
    const savableContent = toSavableContent(processedContent);
    
    if (artifact) {
      const updates: Partial<Artifact> = { ...artifactBaseData };
      if (!isReadonlyEditor) {
        updates.content = savableContent;
      }
      await artifactsContext.update(artifact.id, updates);
    } else {
      await artifactsContext.add({ ...artifactBaseData, content: savableContent, type: 'note' });
      localStorage.removeItem(DRAFT_KEY);
    }
    setIsProcessing(false); handleDelayedClose();
  }, [title, content, tags, artifact, spaceId, artifactsContext, handleDelayedClose, toast, isReadonlyEditor, spacesContext.all]);


  return (
    <Dialog open={isOpen && !isClosing} onOpenChange={(open) => !open && handleDelayedClose()}>
      <DialogContent 
        showCloseButton={!isFullScreen}
        className={cn(
          "flex flex-col p-0 gap-0 transition-all duration-300 ease-smooth",
          isFullScreen
            ? "w-screen h-screen max-w-full max-h-full rounded-none"
            : "max-w-4xl w-full h-[90vh] sm:rounded-lg"
      )}>
        {!isFullScreen && (
            <DialogHeader className="p-4 border-b flex flex-row justify-between items-center shrink-0">
            <DialogTitle className="text-base font-medium text-muted-foreground">
                {artifact ? `Edit Artifact` : 'Create New Artifact'}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
                <Select value={spaceId || 'none'} onValueChange={setSpaceId}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a space" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Space</SelectItem>
                        {spacesContext.all.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            </DialogHeader>
        )}
        <div className={cn(
            "flex-grow flex flex-col gap-2 overflow-y-auto",
            isFullScreen ? "pt-12 px-6 pb-6" : "p-6"
        )}>
          <Input placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} className="font-headline text-3xl border-0 shadow-none focus-visible:ring-0 h-auto py-2 px-2 max-w-[65ch] w-full mx-auto bg-transparent" />
          
          <div className={cn("max-w-[65ch] w-full mx-auto", (tags.length > 0) && "mb-4")}>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-sm py-1">{tag}<button onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button></Badge>))}
                </div>
            )}
            {isSmartSpace && <p className={cn("text-xs text-muted-foreground mt-2")}>This is a smart space. Artifacts need one of its tags to appear here.</p>}
          </div>
          
          <div className="flex-grow prose dark:prose-invert max-w-[65ch] w-full mx-auto prose-p:my-0 prose-p:leading-[1.618] [&_.ProseMirror]:min-h-[40vh] [&_.ProseMirror]:p-2 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:shadow-none [&_.ProseMirror]:bg-transparent">
             <MilkdownEditor 
                ref={editorRef}
                key={artifact?.id || 'new-artifact'} 
                content={content} 
                onChange={setContent} 
                readOnly={isReadonlyEditor} 
            />
          </div>
        </div>

        {!isFullScreen && (
          <DialogFooter className="p-4 border-t bg-background/50 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleUndo} disabled={isProcessing || isReadonlyEditor}>
                      <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRedo} disabled={isProcessing || isReadonlyEditor}>
                      <Redo className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*" />
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()} disabled={isProcessing || !!artifact}>
                      <Paperclip className="h-4 w-4" />
                  </Button>
                  {isTagInputExpanded ? (
                      <div className="relative w-64">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input ref={tagInputRef} placeholder="Add tags and press Enter..." value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyDown={handleTagInput} onBlur={() => { if (currentTag.trim() === '') setIsTagInputExpanded(false); }} className="pl-9 h-9" />
                      </div>
                  ) : (
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsTagInputExpanded(true)}><Tag className="h-4 w-4" /></Button>
                  )}
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsFullScreen(true)}>
                      <Maximize className="h-4 w-4" />
                      <span className="sr-only">Enter Full Screen</span>
                  </Button>
              </div>
              <div className="flex gap-2 shrink-0">
                  <Button variant="outline" onClick={handleDelayedClose} disabled={isProcessing}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 animate-spin" />}
                  {isProcessing ? 'Processing...' : 'Save'}
                  </Button>
              </div>
          </DialogFooter>
        )}

        {isFullScreen && (
          <div className={cn(
            "fixed bottom-8 right-8 z-50 flex items-center gap-3 transition-all duration-300 ease-smooth",
            isUiVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setIsFullScreen(false)}>
              <Minimize className="h-5 w-5" />
              <span className="sr-only">Exit Full Screen</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
