'use client';

import { getDb, ARTIFACTS_STORE_NAME } from './index';
import type { Artifact } from '../types';

export async function getAllArtifacts(): Promise<Artifact[]> {
  const db = await getDb();
  return db.getAllFromIndex(ARTIFACTS_STORE_NAME, 'updatedAt').then(artifacts => artifacts.reverse());
}

export async function getArtifact(id: string): Promise<Artifact | undefined> {
  const db = await getDb();
  return db.get(ARTIFACTS_STORE_NAME, id);
}

export async function addOrUpdateArtifact(artifact: Artifact): Promise<string> {
  const db = await getDb();
  return db.put(ARTIFACTS_STORE_NAME, artifact);
}

export async function deleteArtifactDB(id: string): Promise<void> {
  const db = await getDb();
  return db.delete(ARTIFACTS_STORE_NAME, id);
}

export async function deleteAllArtifactsDB(): Promise<void> {
  const db = await getDb();
  await db.clear(ARTIFACTS_STORE_NAME);
}
