'use client';

import { getDb, SPACES_STORE_NAME } from './index';
import type { Space } from '../types';

export async function getAllSpaces(): Promise<Space[]> {
    const db = await getDb();
    return db.getAllFromIndex(SPACES_STORE_NAME, 'updatedAt').then(spaces => spaces.reverse());
}

export async function addOrUpdateSpace(space: Space): Promise<string> {
    const db = await getDb();
    return db.put(SPACES_STORE_NAME, space);
}

export async function deleteSpaceDB(id: string): Promise<void> {
    const db = await getDb();
    return db.delete(SPACES_STORE_NAME, id);
}
