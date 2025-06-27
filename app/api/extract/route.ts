import { NextRequest, NextResponse } from 'next/server';
import Mercury from '@postlight/mercury-parser';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await Mercury.parse(url, { contentType: 'html'});

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Mercury Parser Error:', error);
    return NextResponse.json({ error: 'Failed to parse article', message: error.message }, { status: 500 });
  }
}
