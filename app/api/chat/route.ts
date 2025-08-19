import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, imageName }: { message?: string; imageName?: string } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const apiUrl = process.env.CHAT_API_URL || 'https://www.apifreellm.com/api/chat';
    const apiKey = process.env.CHAT_API_KEY;

    const system = 'You are a friendly GCSE Maths tutor. Be concise and clear. If an image is mentioned, you do not have access to its pixels; only refer to the description provided.';
    const composed = `${system}\n\nUser: ${message}${imageName ? `\n(An image named \"${imageName}\" was uploaded.)` : ''}`;

    let reply: string | null = null;
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ message: composed }),
        cache: 'no-store',
      });
      if (resp.ok) {
        const data: any = await resp.json();
        reply = data?.reply || data?.response || data?.message || data?.content || null;
        if (!reply && typeof data === 'string') reply = data;
      }
    } catch (_) {}

    if (!reply) {
      reply = 'Thanks for your question! Could you share the key steps you tried so far? Focus on units and ensure operations are applied in the correct order.';
    }

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}


