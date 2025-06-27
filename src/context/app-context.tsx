
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useCallback, useEffect, useState } from 'react';
import { Artifact, ArtifactType, Anchor, Space } from '../types';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import {
  getAllArtifacts,
  addOrUpdateArtifact,
  deleteArtifactDB,
  deleteAllArtifactsDB,
} from '@/lib/db/artifacts';
import {
  getAllAnchors,
  getAnchorByTitle,
  addOrUpdateAnchor,
  deleteAnchorDB
} from '@/lib/db/anchors';
import {
  getAllSpaces,
  addOrUpdateSpace,
  deleteSpaceDB
} from '@/lib/db/spaces';
import { importFromJSON, getDb } from '@/lib/db/index';

// --- Type definitions for the context value ---

interface ArtifactsContextValue {
  all: Artifact[];
  add: (artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'isPinned' | 'isFavorited' | 'isTrashed' | 'isHidden'> & Partial<Pick<Artifact, 'id'>>) => Promise<void>;
  update: (id: string, updates: Partial<Artifact>) => Promise<void>;
  toggleState: (id: string, state: 'isPinned' | 'isFavorited' | 'isTrashed' | 'isHidden') => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  addFromFile: (file: File, spaceId?: string, tags?: string[]) => Promise<void>;
}

interface AnchorsContextValue {
  all: Anchor[];
  add: (anchorData: Omit<Anchor, 'id' | 'createdAt' | 'updatedAt' | 'isTrashed'>) => Promise<{ success: boolean, existing?: Anchor }>;
  update: (id: string, updates: Partial<Omit<Anchor, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean, existing?: Anchor }>;
  toggleState: (id: string, state: 'isTrashed') => Promise<void>;
  delete: (id: string) => Promise<void>;
}

interface SpacesContextValue {
  all: Space[];
  add: (spaceData: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, updates: Partial<Space>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  addArtifactsToSpace: (artifactIds: string[], spaceId: string) => Promise<void>;
}

interface AppContextType {
  artifacts: ArtifactsContextValue;
  anchors: AnchorsContextValue;
  spaces: SpacesContextValue;
  isLoading: boolean;
  importData: (file: File) => Promise<void>;
  exportData: () => void;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dbArtifacts, dbAnchors, dbSpaces] = await Promise.all([getAllArtifacts(), getAllAnchors(), getAllSpaces()]);
      setArtifacts(dbArtifacts);
      setAnchors(dbAnchors);
      setSpaces(dbSpaces);
    } catch (error) {
      console.error("Failed to load data from DB", error);
      toast({ title: "Error", description: "Could not load data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const requestPersistence = async () => {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        if (await navigator.storage.persisted()) {
          console.log("Storage is already persisted.");
          return;
        }
        try {
          const result = await navigator.storage.persist();
           if(result) {
              console.log("Storage persistence successfully granted.");
          } else {
              console.warn("Storage persistence request was not granted.");
          }
        } catch (error) {
          console.error('Failed to request persistent storage:', error);
        }
      }
    };

    requestPersistence();
    loadData();
  }, [loadData]);
  
  // --- Artifact Logic ---

  const addArtifact = useCallback(async (artifactData: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'isPinned' | 'isFavorited' | 'isTrashed' | 'isHidden'> & Partial<Pick<Artifact, 'id'>>) => {
    const now = new Date();
    const newArtifact: Omit<Artifact, 'isAnchored'> & {isAnchored?: boolean} = {
      id: artifactData.id || format(now, 'yyyyMMddHHmmss') + Math.random().toString(36).substring(2, 7),
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      isPinned: false,
      isFavorited: false,
      isTrashed: false,
      isHidden: false,
      tags: artifactData.tags || [],
      ...artifactData,
    };
    delete newArtifact.isAnchored;
    await addOrUpdateArtifact(newArtifact as Artifact);
    await loadData();
    if (!newArtifact.meta?.needsArticleExtraction) {
      toast({ title: "Artifact Created", description: `New ${newArtifact.type} artifact saved.` });
    }
  }, [loadData, toast]);

  const addArtifactFromFile = useCallback(async (file: File, spaceId?: string, tags: string[] = []) => {
    const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;
    const baseArtifactData: Partial<Artifact> = {
        title: fileNameWithoutExt,
        tags,
        spaceId: spaceId === 'none' ? undefined : spaceId,
        meta: { fileName: file.name, fileType: file.type, fileSize: file.size }
    };

    if (file.type.startsWith('text/')) {
        const content = await file.text();
        await addArtifact({ ...baseArtifactData, content: content, type: 'note' });
        toast({ title: "Text File Imported", description: `Saved ${file.name}` });
        return;
    }

    if (file.type.startsWith('audio/')) {
        let imageUri: string | undefined = undefined;
        try {
            const jsmediatags = await import('jsmediatags');
            const tag = await new Promise<any>((resolve, reject) => {
                jsmediatags.read(file, { onSuccess: resolve, onError: reject });
            });
            if (tag.tags.picture) {
                const { data, format } = tag.tags.picture;
                let base64String = "";
                for (let i = 0; i < data.length; i++) base64String += String.fromCharCode(data[i]);
                imageUri = `data:${format};base64,${window.btoa(base64String)}`;
            }
        } catch (error) {
            console.error('Could not read audio tags, proceeding without album art:', error);
        }
        
        const source = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });

        await addArtifact({ ...baseArtifactData, content: file.name, source, leadImageUrl: imageUri, type: 'audio' });
        toast({ title: "Audio File Imported", description: `Saved ${file.name}` });
        return;
    }

    const source = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
    });
    
    let type: ArtifactType = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    await addArtifact({ ...baseArtifactData, content: type === 'image' ? '' : file.name, source, type });
    toast({ title: "File Imported", description: `Saved ${file.name}`});
  }, [addArtifact, toast]);

  const updateArtifact = useCallback(async (id: string, updates: Partial<Artifact>) => {
    const existingArtifact = artifacts.find(a => a.id === id);
    if (!existingArtifact) return;

    const updatedArtifact = { ...existingArtifact, ...updates, updatedAt: Date.now() };
    await addOrUpdateArtifact(updatedArtifact);
    await loadData();
     toast({ title: "Artifact Updated", description: `Artifact has been successfully updated.` });
  }, [artifacts, loadData, toast]);

  const processQueuedArticles = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const artifactsToProcess = artifacts.filter(a => a.meta?.needsArticleExtraction);
    if (artifactsToProcess.length === 0) return;
    toast({ title: 'Back online!', description: `Processing ${artifactsToProcess.length} saved link(s)...` });
    for (const artifact of artifactsToProcess) {
      try {
        const originalUrl = artifact.source || artifact.content;
        let urlForExtraction = originalUrl;

        try {
          const urlObject = new URL(originalUrl);
          if (urlObject.hostname.endsWith('medium.com')) {
            urlForExtraction = `https://freedium.cfd/${urlObject.hostname}${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
          }
        } catch (e) { console.warn("Could not parse offline URL, proceeding with original.", e); }
        
        const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlForExtraction }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Extraction failed'); }
        const articleData = await response.json();
        
        await updateArtifact(artifact.id, {
          title: articleData.title || artifact.title,
          content: articleData.content,
          type: 'article',
          leadImageUrl: articleData.lead_image_url,
          source: originalUrl, // Ensure original source is preserved
          meta: { needsArticleExtraction: false }
        });
        toast({ title: 'Article Imported', description: `Processed: ${articleData.title}` });
      } catch (error: any) {
        console.error(`Failed to process offline article ${artifact.id}:`, error);
        toast({ variant: 'destructive', title: 'Import Failed', description: `Could not process link: ${artifact.content}` });
        await updateArtifact(artifact.id, { meta: { needsArticleExtraction: false } });
      }
    }
  }, [artifacts, updateArtifact, toast]);

  useEffect(() => {
    if (!isLoading) {
        setTimeout(processQueuedArticles, 1000); 
        window.addEventListener('online', processQueuedArticles);
        return () => window.removeEventListener('online', processQueuedArticles);
    }
  }, [isLoading, processQueuedArticles]);

  const toggleArtifactState = useCallback(async (id: string, state: 'isPinned' | 'isFavorited' | 'isTrashed' | 'isHidden') => {
    const existingArtifact = artifacts.find(a => a.id === id);
    if (!existingArtifact) return;
    
    const newState = !existingArtifact[state];
    let message = '';
    switch(state) {
      case 'isPinned': message = newState ? 'Pinned to top' : 'Unpinned'; break;
      case 'isFavorited': message = newState ? 'Added to favorites' : 'Removed from favorites'; break;
      case 'isTrashed': message = newState ? 'Moved to trash' : 'Restored from trash'; break;
      case 'isHidden': message = newState ? 'Artifact hidden' : 'Artifact unhidden'; break;
    }
    
    await updateArtifact(id, { [state]: newState });
    toast({ title: "Artifact Updated", description: message });
  }, [artifacts, updateArtifact, toast]);

  const deleteArtifact = useCallback(async (id: string) => {
    await deleteArtifactDB(id);
    await loadData();
    toast({ title: "Artifact Deleted", description: `Artifact has been permanently deleted.`, variant: 'destructive' });
  }, [loadData, toast]);

  const deleteAllArtifacts = useCallback(async () => {
    await deleteAllArtifactsDB();
    await loadData();
    toast({ title: "Detonation Complete", description: "All artifacts have been permanently deleted.", variant: "destructive" });
  }, [loadData, toast]);

  // --- Anchor Logic ---
  
  const addAnchor = useCallback(async (anchorData: Omit<Anchor, 'id' | 'createdAt' | 'updatedAt' | 'isTrashed'>): Promise<{success: boolean, existing?: Anchor}> => {
    const existing = await getAnchorByTitle(anchorData.title);
    if (existing) return { success: false, existing };
    const now = new Date();
    const newAnchor: Anchor = { id: format(now, 'yyyyMMddHHmmss') + Math.random().toString(36).substring(2, 7), createdAt: now.getTime(), updatedAt: now.getTime(), isTrashed: false, ...anchorData };
    await addOrUpdateAnchor(newAnchor);
    await loadData();
    return { success: true };
  }, [loadData]);

  const updateAnchor = useCallback(async (id: string, updates: Partial<Omit<Anchor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{success: boolean, existing?: Anchor}> => {
    const existingAnchor = anchors.find(a => a.id === id);
    if (!existingAnchor) return { success: false };
    if (updates.title && updates.title !== existingAnchor.title) {
        const conflicting = await getAnchorByTitle(updates.title);
        if (conflicting) return { success: false, existing: conflicting };
    }
    const updatedAnchor = { ...existingAnchor, ...updates, updatedAt: Date.now() };
    await addOrUpdateAnchor(updatedAnchor);
    await loadData();
    return { success: true };
  }, [anchors, loadData]);
  
  const toggleAnchorState = useCallback(async (id: string, state: 'isTrashed') => {
    const existingAnchor = anchors.find(a => a.id === id);
    if (!existingAnchor) return;
    const newState = !existingAnchor[state];
    const message = newState ? 'Moved anchor to trash' : 'Restored anchor from trash';
    const updatedAnchor = { ...existingAnchor, [state]: newState, updatedAt: Date.now() };
    await addOrUpdateAnchor(updatedAnchor);
    await loadData();
    toast({ title: "Anchor Updated", description: message });
  }, [anchors, loadData, toast]);

  const deleteAnchor = useCallback(async (id: string) => {
      await deleteAnchorDB(id);
      await loadData();
      toast({ title: "Anchor Deleted", description: "Anchor has been permanently deleted.", variant: "destructive" });
  }, [loadData, toast]);

  // --- Space Logic ---

  const addSpace = useCallback(async (spaceData: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newSpace: Space = { id: format(now, 'yyyyMMddHHmmss') + Math.random().toString(36).substring(2, 7), createdAt: now.getTime(), updatedAt: now.getTime(), ...spaceData };
    await addOrUpdateSpace(newSpace);
    await loadData();
    toast({ title: "Space Created", description: `New space "${newSpace.name}" created.` });
  }, [loadData, toast]);

  const updateSpace = useCallback(async (id: string, updates: Partial<Space>) => {
    const existingSpace = spaces.find(s => s.id === id);
    if (!existingSpace) return;
    const updatedSpace = { ...existingSpace, ...updates, updatedAt: Date.now() };
    await addOrUpdateSpace(updatedSpace);
    await loadData();
    toast({ title: "Space Updated" });
  }, [spaces, loadData, toast]);

  const deleteSpace = useCallback(async (id: string) => {
    const artifactsToUpdate = artifacts.filter(a => a.spaceId === id);
    for (const artifact of artifactsToUpdate) {
        const updatedArtifact = { ...artifact, spaceId: undefined, updatedAt: Date.now() };
        await addOrUpdateArtifact(updatedArtifact);
    }
    await deleteSpaceDB(id);
    await loadData();
    toast({ title: "Space Deleted", description: "Space removed. Its artifacts are now unassigned.", variant: 'destructive' });
  }, [artifacts, loadData, toast]);
  
  const addArtifactsToSpace = useCallback(async (artifactIds: string[], spaceId: string) => {
    const db = await getDb();
    const tx = db.transaction('artifacts', 'readwrite');
    const promises = artifactIds.map(async (id) => {
        const artifact = await tx.store.get(id);
        if (artifact) {
            artifact.spaceId = spaceId;
            artifact.updatedAt = Date.now();
            await tx.store.put(artifact);
        }
    });
    await Promise.all(promises);
    await tx.done;
    await loadData();
  }, [loadData]);
  
  // --- Global Logic ---

  const importData = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      await importFromJSON(parsed);
      await loadData();
      let counts = [];
      if (parsed.artifacts) counts.push(`${parsed.artifacts.length} artifacts`);
      if (parsed.spaces) counts.push(`${parsed.spaces.length} spaces`);
      if (parsed.anchors) counts.push(`${parsed.anchors.length} anchors`);
      toast({ title: "Import Successful", description: `${counts.join(', ')} imported.` });
    } catch (e: any) {
      console.error("Import failed", e);
      toast({ title: "Import Failed", description: e.message || "Could not parse the file.", variant: 'destructive' });
    }
  }, [loadData, toast]);

  const exportData = useCallback(() => {
    const data = JSON.stringify({ artifacts, anchors, spaces }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini-alps-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Your data has been exported." });
  }, [artifacts, anchors, spaces, toast]);


  const value = useMemo(() => ({
    artifacts: {
      all: artifacts,
      add: addArtifact,
      update: updateArtifact,
      toggleState: toggleArtifactState,
      delete: deleteArtifact,
      deleteAll: deleteAllArtifacts,
      addFromFile: addArtifactFromFile,
    },
    anchors: {
      all: anchors,
      add: addAnchor,
      update: updateAnchor,
      toggleState: toggleAnchorState,
      delete: deleteAnchor,
    },
    spaces: {
      all: spaces,
      add: addSpace,
      update: updateSpace,
      delete: deleteSpace,
      addArtifactsToSpace,
    },
    isLoading,
    importData,
    exportData,
  }), [
      artifacts, addArtifact, updateArtifact, toggleArtifactState, deleteArtifact, deleteAllArtifacts, addArtifactFromFile,
      anchors, addAnchor, updateAnchor, toggleAnchorState, deleteAnchor,
      spaces, addSpace, updateSpace, deleteSpace, addArtifactsToSpace,
      isLoading, importData, exportData
    ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
