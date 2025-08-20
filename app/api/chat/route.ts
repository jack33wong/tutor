import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, isGeometryRequest }: { messages?: Array<{role: string, content: string}>; isGeometryRequest?: boolean } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }
    
    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || !userMessage.content) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }
    
    const message = userMessage.content;

    const apiUrl = process.env.CHAT_API_URL || 'https://www.apifreellm.com/api/chat';
    const apiKey = process.env.CHAT_API_KEY;

    let system: string;
    let composed: string;
    let maxRetries = 3;
    let currentTry = 0;

    if (isGeometryRequest) {
      // Geometry assistant with strict JSON output
      system = `You are a geometry assistant.
Your job is to output only valid JSON that follows this exact schema format:
{
  "setup": {
    "circle": {
      "center": "C",
      "diameter": "AC"
    },
    "triangle": "ABC"
  },
  "instruction": {
    "line": {
      "draw": "line from point B to point C"
    }
  }
}

Do not include explanations, prose, or natural language.
Output nothing except the JSON object.
Always use the exact property names: "setup", "circle", "center", "diameter", "triangle", "instruction", "line", "draw".
Be consistent with the format.`;
      composed = `${system}\n\nUser: ${message}`;
    } else {
      // Regular math tutor
      system = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. If an image is mentioned, you do not have access to its pixels; only refer to the description provided.';
      composed = `${system}\n\nUser: ${message}`;
    }

    let reply: string | null = null;
    
    // Retry loop for geometry requests to ensure valid JSON
    while (currentTry < maxRetries) {
      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ 
            message: composed,
            // Lower temperature for geometry requests to ensure consistent JSON format
            temperature: isGeometryRequest ? 0.1 : 0.7
          }),
          cache: 'no-store',
        });
        
        if (resp.ok) {
          const data: any = await resp.json();
          reply = data?.reply || data?.response || data?.message || data?.content || null;
          if (!reply && typeof data === 'string') reply = data;
          
          // For geometry requests, validate JSON format
          if (isGeometryRequest && reply) {
            try {
              JSON.parse(reply);
              // If JSON is valid, break out of retry loop
              break;
            } catch (jsonError) {
              currentTry++;
              if (currentTry >= maxRetries) {
                reply = `Failed to get valid JSON after ${maxRetries} attempts. Last response: ${reply}`;
              }
              continue;
            }
          } else {
            // For non-geometry requests, no need to retry
            break;
          }
        }
      } catch (_) {
        currentTry++;
        if (currentTry >= maxRetries) {
          reply = 'Network error after multiple attempts. Please try again.';
        }
      }
    }

    if (!reply) {
      if (isGeometryRequest) {
        reply = 'Failed to get valid JSON response from geometry assistant.';
      } else {
        reply = 'Thanks for your question! Could you share the key steps you tried so far? Focus on units and ensure operations are applied in the correct order.';
      }
    }

    // Only normalize LaTeX for non-geometry requests
    if (!isGeometryRequest) {
      reply = normalizeLatex(reply);
    }

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

function normalizeLatex(text: string): string {
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
        }
      }
    }
    
    return processedLine;
  });
  
  const result = processedLines.join('\n');
  return result;
}


