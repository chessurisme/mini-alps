
'use client';

import React from 'react';
import { Artifact, ArtifactType } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Pin, Star, Trash2, Edit, Droplet, Copy, Globe, FileText, Video, Music, Palette, Image as ImageIcon, CirclePlay, Text, Quote, Github, Eye, EyeOff, FileImage, FolderPlus, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ArtifactCardProps {
  artifact: Artifact;
  onView: (artifact: Artifact) => void;
  onEdit: (artifact: Artifact) => void;
  onNavigate: (id: string) => void;
  onCreateNewSpace: () => void;
}

export function ArtifactCard({ artifact, onView, onEdit, onNavigate, onCreateNewSpace }: ArtifactCardProps) {
  const { artifacts: artifactsContext, spaces: spacesContext } = useAppContext();
  const { toast } = useToast();
  const dropdownTriggerRef = React.useRef<HTMLButtonElement>(null);
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);
  const { id, type, title, content, isPinned, isFavorited, isTrashed, isHidden, leadImageUrl, source } = artifact;

  const handleImageError = () => {
    // Only update if there's a leadImageUrl to prevent loops on other source types.
    // This silently corrects the data for a better user experience.
    if (artifact.id && leadImageUrl) {
        artifactsContext.update(artifact.id, { leadImageUrl: '' });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    dropdownTriggerRef.current?.click();
  };

  const handleCopy = (textToCopy: string, message: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: message, description: textToCopy });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menu"]') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    onView(artifact);
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        artifactsContext.update(artifact.id, { leadImageUrl: dataUri });
        toast({ title: 'Cover Image Updated' });
      }
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not read the selected file.' });
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };
  
  const handleAddToSpace = (spaceId?: string) => {
    artifactsContext.update(id, { spaceId });
    toast({ title: 'Artifact Moved', description: `Moved to ${spaceId ? spacesContext.all.find(s=>s.id === spaceId)?.name : 'No Space'}.`});
  };

  const cardImage = type === 'image' ? source : (type === 'article' || (type === 'video' && leadImageUrl) || (type === 'audio' && leadImageUrl)) ? leadImageUrl : undefined;
  
  const iconProps = { size: 14, className: "text-foreground/80" };
  const icons: Record<ArtifactType, React.ReactNode> = {
    note: <Text {...iconProps} />,
    article: <Globe {...iconProps} />,
    image: <ImageIcon {...iconProps} />,
    color: <Palette {...iconProps} />,
    video: <Video {...iconProps} />,
    audio: <Music {...iconProps} />,
    file: <FileText {...iconProps} />,
    quote: <Quote {...iconProps} />,
    repo: <Github {...iconProps} />,
  };
  const typeIcon = icons[type] || <FileText {...iconProps} />;

  const Dropdown = () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
              ref={dropdownTriggerRef}
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()} 
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center border z-10 cursor-pointer transition-colors hover:bg-accent"
            >
              {typeIcon}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleCopy(id, 'Copied ID')}}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy ID</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); artifactsContext.toggleState(id, 'isPinned')}} className={cn(isPinned && 'text-primary')}>
                <Pin className={cn("mr-2 h-4 w-4", isPinned && 'fill-current')} />
                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); artifactsContext.toggleState(id, 'isFavorited')}} className={cn(isFavorited && 'text-primary')}>
                <Star className={cn("mr-2 h-4 w-4", isFavorited && 'fill-current')} />
                <span>{isFavorited ? 'Unfavorite' : 'Favorite'}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); artifactsContext.toggleState(id, 'isHidden')}}>
                {isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                <span>{isHidden ? 'Unhide' : 'Hide'}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); onEdit(artifact)}}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>Add to Space</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleAddToSpace(undefined)}>
                    <div className="w-3 h-3 rounded-full mr-2 border bg-transparent" />
                    <span>No Space</span>
                    {!artifact.spaceId && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  {spacesContext.all.filter(s => !s.isSmart).map((space) => (
                    <DropdownMenuItem key={space.id} onClick={() => handleAddToSpace(space.id)}>
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: space.color }} />
                      <span>{space.name}</span>
                      {artifact.spaceId === space.id && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onCreateNewSpace}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create New Space</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {(type === 'article' || type === 'video' || type === 'audio') && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); coverImageInputRef.current?.click(); }}>
                  <FileImage className="mr-2 h-4 w-4" />
                  <span>Change Cover</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={(e) => {e.stopPropagation(); artifactsContext.toggleState(id, 'isTrashed')}} className={cn(!isTrashed && 'text-destructive focus:text-destructive')}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isTrashed ? 'Restore' : 'Trash'}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )


  if (type === 'article' && cardImage) {
    return (
      <div className="w-full">
        <input type="file" ref={coverImageInputRef} className="hidden" accept="image/*" onChange={handleCoverImageChange} />
        <Card 
          className={cn(
            "break-inside-avoid-column overflow-hidden transition-all duration-300 ease-smooth hover:shadow-lg cursor-pointer flex flex-col group relative",
            isPinned && "border-primary border-2",
            !isPinned && isFavorited && "border-muted-foreground/60"
          )} 
          onContextMenu={handleContextMenu}
          onClick={handleCardClick}
        >
          <div className="flex flex-col aspect-[4/5]">
            <div className="relative basis-[61%] min-h-0">
              <Dropdown />
              <img src={cardImage} alt={title || 'Artifact image'} className="absolute inset-0 w-full h-full object-cover" data-ai-hint="abstract texture" onError={handleImageError} />
            </div>
            <CardContent className="basis-[39%] min-h-0 p-4 flex items-center bg-card">
              <h3 className="font-headline text-lg leading-tight line-clamp-3 text-pretty">{title}</h3>
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {(type === 'article' || type === 'video' || type === 'audio') && <input type="file" ref={coverImageInputRef} className="hidden" accept="image/*" onChange={handleCoverImageChange} />}
      <Card 
        className={cn(
          "break-inside-avoid-column overflow-hidden transition-all duration-300 ease-smooth hover:shadow-lg cursor-pointer flex flex-col group relative",
          isPinned && "border-primary border-2",
          !isPinned && isFavorited && "border-muted-foreground/60"
        )} 
        onContextMenu={handleContextMenu}
        onClick={handleCardClick}
      >
        <div className="relative">
            <Dropdown />
            {type === 'color' && (
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(content, 'Copied Hex'); }} className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/30 text-white hover:bg-white/50 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Droplet className="h-4 w-4" />
              </Button>
            )}

          {cardImage && (
            <img src={cardImage} alt={title || 'Artifact image'} className="block w-full h-auto" data-ai-hint="abstract texture" onError={handleImageError} />
          )}

          {type === 'video' && cardImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CirclePlay className="w-12 h-12 text-white/90" />
            </div>
          )}

          {type === 'color' && <div className="w-full pt-[75%]" style={{ backgroundColor: content }} />}
        </div>

        {type === 'quote' && (
            <CardContent className="relative flex flex-col flex-grow items-center justify-center p-8 text-center min-h-[12rem]">
                <span className="absolute left-4 top-4 text-7xl font-serif text-muted-foreground/20">“</span>
                 <div className={cn(
                    "font-headline z-10 leading-tight text-pretty italic",
                    content.length > 150 ? "text-2xl" : "text-3xl"
                 )}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            p: (props) => <p className="my-0" {...props} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
                <span className="absolute right-4 bottom-0 text-7xl font-serif text-muted-foreground/20">”</span>
                {title && <p className="text-sm text-muted-foreground mt-4">— {title}</p>}
            </CardContent>
        )}
        
        {type === 'repo' && (
          <CardContent className="flex flex-col flex-grow p-4">
              <Github className="w-6 h-6 mb-3 text-muted-foreground" />
              {title && <h3 className="font-headline text-xl mb-2">{title}</h3>}
          </CardContent>
        )}

        {(type === 'file' || (type === 'video' && !cardImage)) && (
            <CardContent className="flex flex-col flex-grow p-4">
                {type === 'file' && <FileText className="w-6 h-6 mb-3 text-muted-foreground" />}
                {type === 'video' && <Video className="w-6 h-6 mb-3 text-muted-foreground" />}
                {title && <h3 className="font-headline text-xl mb-2 line-clamp-3">{title}</h3>}
            </CardContent>
        )}

        {(type === 'note' || (type === 'article' && !cardImage) || (type === 'audio' && !cardImage)) && (
             <CardContent className="flex flex-col flex-grow p-4">
                {title && type !== 'note' && <h3 className="font-headline text-xl mb-2">{title}</h3>}
                 <div className="text-sm text-muted-foreground flex-grow text-pretty max-h-60 overflow-hidden relative">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        urlTransform={(url) => url}
                        components={{
                            p: (props) => <p className="my-1" {...props} />,
                            ul: ({ node, className, ...props }) => {
                                const isTaskList = className?.includes('contains-task-list');
                                return <ul className={cn('my-1', isTaskList ? 'list-none pl-1' : 'list-disc pl-5')} {...props} />;
                            },
                            ol: (props) => <ol className="list-decimal pl-5 my-1" {...props} />,
                            li: ({node, className, ...props}) => <li className={cn("my-0.5", className?.includes('task-list-item') && 'list-none')} {...props} />,
                            input: ({disabled, checked}) => {
                                return <input type="checkbox" disabled={true} defaultChecked={checked} className="mr-2 -translate-y-px" />
                            },
                            a: ({node, href, ...props}) => {
                                if (href?.startsWith('wm://open/')) {
                                  return (
                                    <span
                                      className="font-code text-muted-foreground p-1 bg-muted rounded-sm cursor-default no-underline"
                                    >
                                      {props.children}
                                    </span>
                                  );
                                }
                                return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()} />;
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                </div>
             </CardContent>
        )}
      </Card>
      {(type === 'image' || type === 'video' || (type === 'audio' && cardImage) || type === 'color' || type === 'note') && title && (
        <p className="mt-2 text-xs font-medium text-center text-muted-foreground">{title}</p>
      )}
    </div>
  );
}

    
