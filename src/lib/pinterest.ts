export interface PinterestData {
  imageUrl: string | null;
  title: string | null;
}

export async function getPinterestImage(url: string): Promise<PinterestData> {
  try {
    const res = await fetch('/api/pinterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Failed to fetch Pinterest image');
    return await res.json();
  } catch (error) {
    console.error('Failed to get Pinterest image', error);
    return { imageUrl: null, title: null };
  }
}
