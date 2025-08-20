import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, imageName }: { message?: string; imageName?: string } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const apiUrl = process.env.CHAT_API_URL || 'https://www.apifreellm.com/api/chat';
    const apiKey = process.env.CHAT_API_KEY;

    const system = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. If an image is mentioned, you do not have access to its pixels; only refer to the description provided.';
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

    // Normalize LaTeX formatting for better rendering
    reply = normalizeLatex(reply);

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

function normalizeLatex(text: string): string {
  console.log('Normalizing LaTeX text:', text);
  
  // Split into lines for processing
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    // Look for mathematical expressions that might need proper delimiters
    let processedLine = line;
    
    // Handle common LaTeX patterns that should be wrapped in display math
    if (line.includes('\\frac') || line.includes('\\sqrt') || line.includes('\\left') || line.includes('\\right')) {
      // If it's not already wrapped in delimiters, wrap it
      if (!line.includes('\\[') && !line.includes('\(') && !line.includes('$')) {
        // Find the mathematical part and wrap it
        const mathMatch = line.match(/(.*?)(\\frac|\\sqrt|\\left|\\right.*?)(.*)/);
        if (mathMatch) {
          const before = mathMatch[1];
          const math = mathMatch[2];
          const after = mathMatch[3];
          processedLine = `${before}\\[${math}\\]${after}`;
          console.log('Wrapped LaTeX:', math, 'in delimiters');
        }
      }
    }
    
    return processedLine;
  });
  
  const result = processedLines.join('\n');
  console.log('Normalized result:', result);
  return result;
}


