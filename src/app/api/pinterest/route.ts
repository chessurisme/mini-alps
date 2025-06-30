import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const resp = await fetch(url);
    const html = await resp.text();

    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    const title = titleMatch ? titleMatch[1] : null;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ imageUrl, title });
  } catch (error: any) {
    console.error('Pinterest Parse Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pin', message: error.message }, { status: 500 });
  }
}
