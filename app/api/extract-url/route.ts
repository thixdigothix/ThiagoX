import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const response = await fetch(url);
    const text = await response.text();
    
    // We only need a portion of the text to avoid hitting Gemini context limits or being too slow
    // but enough to find a top 10 list. Let's take the first 50k chars.
    const cleanText = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '')
                          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, '')
                          .substring(0, 50000);

    return NextResponse.json({ content: cleanText });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json({ error: 'Failed to fetch URL content' }, { status: 500 });
  }
}
