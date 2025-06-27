'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Artifact, Anchor, Space } from '../types';

export const DB_NAME = 'mini-alps-db';
export const DB_VERSION = 3;
export const ARTIFACTS_STORE_NAME = 'artifacts';
export const ANCHORS_STORE_NAME = 'anchors';
export const SPACES_STORE_NAME = 'spaces';

export interface MiniAlpsDB extends DBSchema {
  [ARTIFACTS_STORE_NAME]: {
    key: string;
    value: Artifact;
    indexes: { 'updatedAt': number; 'spaceId': string };
  };
  [ANCHORS_STORE_NAME]: {
    key: string;
    value: Anchor;
    indexes: { 'title': string, 'updatedAt': number };
  };
  [SPACES_STORE_NAME]: {
    key: string;
    value: Space;
    indexes: { 'updatedAt': number };
  }
}

let dbPromise: Promise<IDBPDatabase<MiniAlpsDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<MiniAlpsDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB cannot be accessed on the server.'));
  }
  if (!dbPromise) {
    dbPromise = openDB<MiniAlpsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const artifactStore = db.createObjectStore(ARTIFACTS_STORE_NAME, { keyPath: 'id' });
          artifactStore.createIndex('updatedAt', 'updatedAt');
        }
        if (oldVersion < 2) {
          const anchorStore = db.createObjectStore(ANCHORS_STORE_NAME, { keyPath: 'id' });
          anchorStore.createIndex('title', 'title', { unique: true });
          anchorStore.createIndex('updatedAt', 'updatedAt');
        }
        if (oldVersion < 3) {
            const spaceStore = db.createObjectStore(SPACES_STORE_NAME, { keyPath: 'id' });
            spaceStore.createIndex('updatedAt', 'updatedAt');

            const artifactStore = transaction.objectStore(ARTIFACTS_STORE_NAME);
            artifactStore.createIndex('spaceId', 'spaceId');
        }
      },
    });
  }
  return dbPromise;
}

export async function importFromJSON(data: { artifacts?: Artifact[], spaces?: Space[], anchors?: Anchor[] }): Promise<void> {
  const db = await getDb();
  
  if (data.artifacts) {
    const tx = db.transaction(ARTIFACTS_STORE_NAME, 'readwrite');
    await tx.store.clear();
    await Promise.all(data.artifacts.map(artifact => tx.store.put(artifact)));
    await tx.done;
  }
  if (data.spaces) {
    const tx = db.transaction(SPACES_STORE_NAME, 'readwrite');
    await tx.store.clear();
    await Promise.all(data.spaces.map(space => tx.store.put(space)));
    await tx.done;
  }
  if (data.anchors) {
    const tx = db.transaction(ANCHORS_STORE_NAME, 'readwrite');
    await tx.store.clear();
    await Promise.all(data.anchors.map(anchor => tx.store.put(anchor)));
    await tx.done;
  }
}
