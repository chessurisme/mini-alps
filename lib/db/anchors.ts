'use client';

import { getDb, ANCHORS_STORE_NAME } from './index';
import type { Anchor } from '../types';

export async function getAllAnchors(): Promise<Anchor[]> {
    const db = await getDb();
    return db.getAllFromIndex(ANCHORS_STORE_NAME, 'updatedAt').then(anchors => anchors.reverse());
}

export async function getAnchorByTitle(title: string): Promise<Anchor | undefined> {
    const db = await getDb();
    return db.getFromIndex(ANCHORS_STORE_NAME, 'title', title);
}

export async function addOrUpdateAnchor(anchor: Anchor): Promise<string> {
    const db = await getDb();
    return db.put(ANCHORS_STORE_NAME, anchor);
}

export async function deleteAnchorDB(id: string): Promise<void> {
    const db = await getDb();
    return db.delete(ANCHORS_STORE_NAME, id);
}
