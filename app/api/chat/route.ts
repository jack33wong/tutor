import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, imageData, imageName, messages, isGeometryRequest }: { 
      message?: string; 
      imageData?: string; 
      imageName?: string;
      messages?: Array<{role: string, content: string}>; 
      isGeometryRequest?: boolean 
    } = await req.json();
    
    // Handle both new format (message, imageData, imageName) and old format (messages, isGeometryRequest)
    let userMessage: string;
    let isGeometry: boolean = false;
    
    if (message) {
      // New format
      userMessage = message;
      isGeometry = false; // New format doesn't support geometry requests yet
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      // Old format
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content) {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
      }
      userMessage = lastMessage.content;
      isGeometry = isGeometryRequest || false;
    } else {
      return NextResponse.json({ error: 'Missing message or messages' }, { status: 400 });
    }

    // Use ChatGPT API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    let systemPrompt: string;
    let maxRetries = 3;
    let currentTry = 0;

    if (isGeometry) {
      // Geometry assistant with strict JSON output
      systemPrompt = `You are a geometry assistant.
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
    } else {
      // Regular math tutor
      systemPrompt = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. If an image is mentioned, you do not have access to its pixels; only refer to the description provided.';
    }

    let reply: string | null = null;
    
    // Retry loop for geometry requests to ensure valid JSON
    while (currentTry < maxRetries) {
      try {
        // Prepare messages for OpenAI API
        const openaiMessages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ];

        // If there's an image, add it to the user message
        if (imageData && imageName) {
          openaiMessages[1] = {
            role: 'user',
            content: [
              { type: 'text', text: userMessage },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ] as any
          };
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o', // Using GPT-4o for better performance
            messages: openaiMessages,
            temperature: isGeometry ? 0.1 : 0.7,
            max_tokens: 1000,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || null;
          
          if (reply) {
            // For geometry requests, validate JSON format
            if (isGeometry) {
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
        } else {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          currentTry++;
          if (currentTry >= maxRetries) {
            reply = `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`;
          }
        }
      } catch (error) {
        console.error('Network error:', error);
        currentTry++;
        if (currentTry >= maxRetries) {
          reply = 'Network error after multiple attempts. Please try again.';
        }
      }
    }

    if (!reply) {
      if (isGeometry) {
        reply = 'Failed to get valid JSON response from geometry assistant.';
      } else {
        reply = 'Thanks for your question! Could you share the key steps you tried so far? Focus on units and ensure operations are applied in the correct order.';
      }
    }

    // Only normalize LaTeX for non-geometry requests
    if (!isGeometry) {
      reply = normalizeLatex(reply);
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Chat API error:', e);
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


