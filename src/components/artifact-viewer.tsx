'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Artifact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Download, ExternalLink, Copy, File as FileIcon, X, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import TurndownService from 'turndown';
import convert from 'color-convert';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { extractYouTubeID } from '@/lib/youtube';
import { extractColors } from 'extract-colors'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ArtifactViewerProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (artifact: Artifact) => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

const ImagePalette = ({ imageUrl, onCopy, className }: { imageUrl: string, onCopy: (text: string, label: string) => void, className?: string }) => {
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl) return;

    let isCancelled = false;
    setLoading(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (isCancelled) return;
      extractColors(img)
        .then(colors => {
          if (isCancelled) return;
          const hexColors = colors.map(c => c.hex).slice(0, 10);
          setPalette(hexColors);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to extract colors", err);
          if (isCancelled) return;
          setLoading(false);
        });
    }
    img.onerror = (err) => {
        console.error("Failed to load image for color extraction", err);
        if (isCancelled) return;
        setLoading(false);
    }
    
    return () => {
      isCancelled = true;
    }
  }, [imageUrl]);

  if (loading || !palette.length) return null;

  return (
    <div className={cn("absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 backdrop-blur-sm p-2 rounded-lg flex flex-col gap-2 z-20 transition-opacity", className)}>
      <TooltipProvider>
        {palette.map((color) => (
          <Tooltip key={color}>
            <TooltipTrigger asChild>
              <div
                className="h-6 w-6 rounded-full cursor-pointer border-2 border-white/50"
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(color, 'Color')
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{color}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

const getContrastingTextColor = (hex: string) => {
  if (!hex) return '#000000';
  try {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    if (cleanHex.length !== 6 && cleanHex.length !== 3) return '#000000';
    const rgb = convert.hex.rgb(cleanHex);
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  } catch (e) {
    return '#000000';
  }
};


export function ArtifactViewer({ artifact, isOpen, onClose, onEdit, onNavigate, onTagClick }: ArtifactViewerProps) {
  const { toast } = useToast();
  const [showFooter, setShowFooter] = useState(true);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const viewportRef = useRef<HTMLMetaElement | null>(null);
  const originalViewportContent = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      viewportRef.current = document.querySelector('meta[name="viewport"]');
      if (viewportRef.current) {
        originalViewportContent.current = viewportRef.current.getAttribute('content');
      }
    }
  }, []);

  useEffect(() => {
    if (artifact?.type !== 'image' || !viewportRef.current) return;

    if (!isUiVisible) {
      // Focus mode, allow zooming
      viewportRef.current.setAttribute('content', 'width=device-width, initial-scale=1');
    } else {
      // UI visible, disable zooming
      if (originalViewportContent.current) {
        viewportRef.current.setAttribute('content', originalViewportContent.current);
      }
    }

    return () => {
      // Restore on unmount
      if (originalViewportContent.current && viewportRef.current) {
        viewportRef.current.setAttribute('content', originalViewportContent.current);
      }
    };
  }, [isUiVisible, artifact?.type]);

  const handleScroll = useCallback(() => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      setShowFooter(false);
      scrollTimeoutRef.current = setTimeout(() => {
        setShowFooter(true);
      }, 1500);
  }, []);

  const handleScrollUp = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setShowFooter(true);
  }, []);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    let lastScrollTop = viewport.scrollTop;

    const onScroll = () => {
      const scrollTop = viewport.scrollTop;
      if (scrollTop > lastScrollTop) {
        handleScroll(); // Scrolling down
      } else {
        handleScrollUp(); // Scrolling up
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    viewport.addEventListener('scroll', onScroll);
    return () => {
      viewport.removeEventListener('scroll', onScroll);
       if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleScrollUp, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowFooter(true);
      setIsUiVisible(true);
    }
  }, [isOpen]);

  if (!artifact) return null;

  const handleDownloadMarkdown = () => {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(artifact.content);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/ /g, '_') || 'artifact'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadFile = () => {
    if (!artifact?.source) return;
    const link = document.createElement("a");
    link.href = artifact.source;
    const fileName = artifact.title || artifact.id;
    const extension = artifact.source.match(/data:image\/(.+);/)?.[1] || 'png';
    link.download = `${fileName.replace(/ /g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContentWithWikiLinks = (content: string) => {
    if (!content) return null;

    return (
      <ReactMarkdown
        className="prose prose-lg dark:prose-invert mx-auto text-pretty"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        urlTransform={(url) => url}
        components={{
          a: ({ node, href, ...props }) => {
            if (href?.startsWith('wm://open/')) {
              const artifactId = href.substring(10);
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onNavigate(artifactId);
                  }}
                  className="font-code text-muted-foreground p-1 bg-muted rounded-sm cursor-pointer hover:bg-primary hover:text-primary-foreground no-underline transition-colors"
                >
                  {props.children}
                </button>
              );
            }
            return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
          },
          input: ({node, checked}) => {
            // By not passing `disabled`, it becomes interactive in the viewer.
            // This is a visual-only interaction; it doesn't save state.
            return <input type="checkbox" defaultChecked={checked} className="mr-2 cursor-pointer" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied ${label}`, description: text });
  };
  
  const renderStandardFooter = (artifact: Artifact, actions?: React.ReactNode) => (
    <DialogFooter className="p-4 border-t flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-1 text-sm flex-wrap">
            <span className="font-semibold text-muted-foreground">ID:</span>
            <code 
                className="font-code text-muted-foreground p-1 bg-muted rounded-sm cursor-pointer hover:bg-muted/80"
                onClick={() => handleCopy(artifact.id, 'ID')}
            >
                {artifact.id}
            </code>
             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(artifact.id, 'ID')}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
        {artifact.tags && artifact.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
                 <span className="font-semibold text-muted-foreground">Tags:</span>
                {artifact.tags.map(tag => (
                    <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => onTagClick(tag)}
                    >
                        {tag}
                    </Badge>
                ))}
            </div>
        )}
      <div className="flex items-center gap-2">
        {actions}
        <Button variant="outline" onClick={() => onEdit(artifact)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>
    </DialogFooter>
  );


  const renderViewerContent = () => {
    switch(artifact.type) {
      case 'article':
        return (
          <>
             <DialogClose asChild>
                <Button variant="ghost" size="icon" className={cn("absolute top-4 right-4 z-50 h-9 w-9 rounded-full bg-background/50 text-foreground backdrop-blur-sm transition-all duration-300 hover:bg-background/80", !showFooter && "opacity-0 -translate-y-20")}>
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
            <DialogHeader className="sr-only">
                <DialogTitle>{artifact.title || 'Article'}</DialogTitle>
            </DialogHeader>
            <ScrollArea ref={scrollAreaRef} className="flex-grow bg-background">
              <div className="container mx-auto px-4 py-12">
                {artifact.leadImageUrl && (
                  <div className="relative aspect-[16/4] mb-8 rounded-lg overflow-hidden -mx-4 sm:-mx-6">
                    <img
                      src={artifact.leadImageUrl}
                      alt={artifact.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      data-ai-hint="article cover"
                    />
                  </div>
                )}
                <div className="flex justify-center w-full">
                  <article className="prose prose-lg lg:prose-xl dark:prose-invert mx-auto max-w-[65ch] w-full text-pretty">
                    <h1 className="font-headline text-center">{artifact.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: artifact.content }} />
                  </article>
                </div>
                <div className="flex justify-center w-full">
                  <ReactMarkdown
                    className="prose prose-lg lg:prose-xl dark:prose-invert mx-auto max-w-[65ch] w-full text-pretty"
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    urlTransform={(url) => url}
                    components={{
                      code: ({node, inline, className, children, ...props}) => {
                        return <code className={cn(className, "break-words whitespace-pre-wrap overflow-x-auto block p-2 rounded-md max-w-full")} {...props}>{children}</code>
                      }
                    }}
                  >{artifact.content}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
             <DialogFooter className={cn("p-4 border-t gap-2 transition-transform duration-300 flex-row justify-center", !showFooter && "translate-y-full")}>
              <Button variant="outline" onClick={() => onEdit(artifact)}>
                <Edit className="h-4 w-4" />
                <span className={cn('md:inline-block', isMobile && 'hidden', 'ml-2')}>Edit Tags</span>
              </Button>
              <Button variant="outline" onClick={handleDownloadMarkdown}>
                <Download className="h-4 w-4" />
                 <span className={cn('md:inline-block', isMobile && 'hidden', 'ml-2')}>Download</span>
              </Button>
              {artifact.source && (
                 <Button variant="outline" asChild>
                    <a href={artifact.source} target="_blank" rel="noopener noreferrer">
 
                        <ExternalLink className="h-4 w-4" />
                        <span className={cn('md:inline-block', isMobile && 'hidden', 'ml-2')}>Visit Original</span>
                    </a>
                </Button>
              )}
            </DialogFooter>
          </>
        );

      case 'note':
        return (
           <>
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="font-headline text-3xl">{artifact.title || 'Note'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6">
                {renderContentWithWikiLinks(artifact.content)}
            </ScrollArea>
            {renderStandardFooter(artifact)}
          </>
        );
      
      case 'quote':
        const quoteFontSize = artifact.content.length > 200 ? 'text-4xl' : 'text-4xl lg:text-5xl';
        return (
           <>
            <DialogHeader className="p-6 pb-2 sr-only">
                <DialogTitle>{artifact.title || 'Quote'}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow flex items-center justify-center p-8 text-center bg-secondary/30">
                <div className="relative max-w-3xl">
                    <span className="absolute -left-12 -top-8 text-9xl font-serif text-muted-foreground/20">“</span>
                     <div className={cn("font-headline leading-tight text-pretty italic", quoteFontSize)}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        allowedElements={['p', 'strong', 'del']}
                        unwrapDisallowed
                        components={{
                            p: (props) => <p className="my-0" {...props} />,
                        }}
                      >
                          {artifact.content}
                      </ReactMarkdown>
                    </div>
                    {artifact.title && <p className="text-xl text-muted-foreground mt-6">— {artifact.title}</p>}
                    <span className="absolute -right-12 -bottom-10 text-9xl font-serif text-muted-foreground/20">”</span>
                </div>
            </div>
            {renderStandardFooter(artifact)}
          </>
        );
        
      case 'image':
      case 'video':
        const isYouTube = artifact.type === 'video' && artifact.source?.includes('youtu');
        const mediaSource = isYouTube 
          ? `https://www.youtube.com/embed/${extractYouTubeID(artifact.source || '')}` 
          : artifact.source;
        const MediaComponent = artifact.type === 'image' 
          ? 'img' 
          : isYouTube ? 'iframe' : 'video';
        
        const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if ((e.target as HTMLElement).closest('button, a, video, iframe')) {
              e.stopPropagation();
              return;
            }
            if (artifact.type === 'image') {
              setIsUiVisible(v => !v);
            }
        };

        const mediaProps: any = {
          src: mediaSource,
          className: cn(
            "max-w-full max-h-[85vh] object-contain z-10",
            artifact.type === 'video' && 'w-full max-w-4xl aspect-video'
          )
        };
        if (artifact.type === 'image') {
          mediaProps.alt = artifact.title || 'Artifact Media';
          mediaProps.crossOrigin = "anonymous";
        }
        if (MediaComponent === 'video') {
          mediaProps.controls = true;
        }
        if (MediaComponent === 'iframe') {
          mediaProps.title = "YouTube video player";
          mediaProps.frameBorder = "0";
          mediaProps.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
          mediaProps.allowFullScreen = true;
        }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-4" onClick={handleContainerClick}>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className={cn("absolute top-4 right-4 h-9 w-9 text-white bg-black/30 hover:bg-black/50 hover:text-white z-50 transition-opacity", !isUiVisible && 'opacity-0')}>
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
                <div className={cn("absolute top-4 left-4 flex gap-2 z-50 transition-opacity", !isUiVisible && 'opacity-0')}>
                    {artifact.type === 'image' && (
                        <Button variant="ghost" size="icon" onClick={handleDownloadFile} className="h-9 w-9 text-white bg-black/30 hover:bg-black/50 hover:text-white">
                            <Download className="h-5 w-5" />
                        </Button>
                    )}
                    {(artifact.type === 'image' || artifact.type === 'video' || artifact.type === 'audio') && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(artifact)} className="h-9 w-9 text-white bg-black/30 hover:bg-black/50 hover:text-white">
                            <Edit className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <DialogHeader className="sr-only">
                    <DialogTitle>{artifact.title || artifact.type}</DialogTitle>
                </DialogHeader>
               {mediaSource && <MediaComponent {...mediaProps} />}
               <p className={cn("text-white mt-4 font-headline z-10 transition-opacity", !isUiVisible && 'opacity-0')}>{artifact.title}</p>
                {artifact.type === 'image' && artifact.source && (
                    <ImagePalette imageUrl={artifact.source} onCopy={handleCopy} className={cn(!isUiVisible && 'opacity-0')} />
                )}
            </div>
        )
      
      case 'audio':
        const handleAudioWhitespaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        };
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-4" onClick={handleAudioWhitespaceClick}>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-9 w-9 text-white bg-black/30 hover:bg-black/50 hover:text-white z-50">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
                 <Button variant="ghost" size="icon" onClick={() => onEdit(artifact)} className="absolute top-4 left-4 h-9 w-9 text-white bg-black/30 hover:bg-black/50 hover:text-white z-50">
                    <Edit className="h-5 w-5" />
                </Button>
                <DialogHeader className="sr-only">
                    <DialogTitle>{artifact.title || artifact.type}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 z-10 w-full max-w-md">
                    {artifact.leadImageUrl && (
                        <img src={artifact.leadImageUrl} alt={artifact.title || 'Album art'} className="w-full max-w-xs aspect-square rounded-lg shadow-lg" data-ai-hint="album cover music" />
                    )}
                    <p className="text-white text-lg font-headline text-center">{artifact.title}</p>
                    {artifact.source && (
                        <audio 
                            src={artifact.source} 
                            className="w-full"
                            controls
                        />
                    )}
                </div>
            </div>
        )

      case 'repo':
        return (
          <>
            <DialogHeader className="p-6 pb-2 bg-background">
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/10 dark:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Repository</p>
                <DialogTitle className="font-headline text-3xl !mt-1">{artifact.title || 'Repository'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-grow px-6 bg-background">
                <div className="py-4">
                  {renderContentWithWikiLinks(artifact.content)}
                </div>
            </ScrollArea>
            {renderStandardFooter(artifact, (
                artifact.source && (
                    <Button asChild variant="outline">
                        <a href={artifact.source} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" />View on GitHub</a>
                    </Button>
                )
            ))}
          </>
        );

      case 'file':
        const handleDownloadFile = () => {
            if (!artifact.source) return;
            const link = document.createElement("a");
            link.href = artifact.source;
            link.download = artifact.meta?.fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-background p-4 text-center">
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl">{artifact.title || 'File'}</DialogTitle>
                </DialogHeader>
                <FileIcon className="w-24 h-24 my-8 text-muted-foreground" />
                <p className="text-muted-foreground">File: {artifact.meta?.fileName}</p>
                <p className="text-muted-foreground">Type: {artifact.meta?.fileType}</p>
                <p className="text-muted-foreground">Size: {artifact.meta?.fileSize ? `${(artifact.meta.fileSize / 1024).toFixed(2)} KB` : 'N/A'}</p>
                {artifact.tags && artifact.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-4 max-w-md justify-center">
                      <span className="font-semibold text-muted-foreground">Tags:</span>
                      {artifact.tags.map(tag => (
                          <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => onTagClick(tag)}
                          >
                              {tag}
                          </Badge>
                      ))}
                  </div>
                )}
                <DialogFooter className="mt-8 flex-row gap-2 justify-center">
                    <Button onClick={handleDownloadFile}><Download className="mr-2 h-4 w-4" />Download File</Button>
                    <Button variant="outline" onClick={() => onEdit(artifact)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                </DialogFooter>
            </div>
        );

      case 'color':
        const hex = artifact.content;
        const textColor = getContrastingTextColor(hex);
        const buttonBg = textColor === '#FFFFFF' ? 'bg-black/40 hover:bg-black/60' : 'bg-white/40 hover:bg-white/60';
        const rgb = convert.hex.rgb(hex).join(', ');
        const hsl = convert.hex.hsl(hex).join(', ');
        const hsv = convert.hex.hsv(hex).join(', ');
        const cmyk = convert.hex.cmyk(hex).join(', ');

        const colorFormats = [
            { label: 'HEX', value: hex },
            { label: 'RGB', value: `rgb(${rgb})` },
            { label: 'HSL', value: `hsl(${hsl})` },
            { label: 'HSV', value: `hsv(${hsv})` },
            { label: 'CMYK', value: `cmyk(${cmyk})` },
        ];
        return (
             <div className="w-full h-full flex flex-col md:flex-row bg-background">
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className={cn("absolute top-4 right-4 z-50 h-9 w-9 rounded-full backdrop-blur-sm transition-colors", buttonBg)} style={{color: textColor}}>
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
                 <DialogHeader className="sr-only">
                    <DialogTitle>{artifact.title || "Color"}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow md:w-2/3 h-1/2 md:h-full flex items-center justify-center p-8 transition-colors duration-300" style={{backgroundColor: hex}}>
                    <div className="text-center" style={{color: textColor}}>
                        <h1 className="text-4xl lg:text-6xl font-display font-bold">{artifact.title}</h1>
                        <p className="font-code text-xl lg:text-2xl mt-2">{hex}</p>
                    </div>
                </div>
                 <div className="md:w-1/3 h-1/2 md:h-full bg-card text-card-foreground p-6 flex flex-col justify-center">
                    <h3 className="font-headline text-2xl mb-6">Color Codes</h3>
                    <div className="space-y-3 font-code">
                        {colorFormats.map(format => (
                            <div key={format.label} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-muted-foreground">{format.label}</span>
                                <code 
                                    className="p-1 bg-muted rounded-sm cursor-pointer hover:bg-muted/80"
                                    onClick={() => handleCopy(format.value, format.label)}
                                >
                                    {format.value}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )

      default:
        return (
            <>
              <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="font-headline text-3xl">{artifact.title || 'Artifact'}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-grow px-6">
                  {renderContentWithWikiLinks(artifact.content)}
              </ScrollArea>
              {renderStandardFooter(artifact)}
            </>
        )
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={!['article', 'image', 'video', 'audio', 'color', 'repo'].includes(artifact?.type || '')}
        className={cn(
        "max-w-full w-full h-full flex flex-col p-0 gap-0 border-0 overflow-hidden",
        (artifact?.type === 'image' || artifact?.type === 'video' || artifact?.type === 'audio' || artifact?.type === 'color' || artifact?.type === 'file') && 'bg-transparent',
        (artifact?.type === 'article' || artifact?.type === 'color' || artifact?.type === 'repo') && 'p-0'
      )}>
        {artifact && renderViewerContent()}
      </DialogContent>
    </Dialog>
  );
}
