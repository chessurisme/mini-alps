
export type ArtifactType = 'note' | 'color' | 'article' | 'image' | 'video' | 'audio' | 'file' | 'quote' | 'repo';

export interface Space {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  isSmart?: boolean;
  tags?: string[];
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  tags: string[];
  spaceId?: string;
  source?: string; // URL for articles, videos, etc. Data URI for images/files.
  leadImageUrl?: string; // For article cover image
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isFavorited: boolean;
  isTrashed: boolean;
  isHidden: boolean;
  meta?: {
    needsArticleExtraction?: boolean;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  };
}

export interface Anchor {
  id: string;
  title: string;
  artifactIds: string[];
  createdAt: number;
  updatedAt: number;
  isTrashed: boolean;
}
