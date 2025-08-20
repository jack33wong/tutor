import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, imageData, imageName }: { message?: string; imageData?: string; imageName?: string } = await req.json();
    
    // Allow requests with either a message or an image
    if ((!message || typeof message !== 'string') && (!imageData || !imageName)) {
      return NextResponse.json({ error: 'Missing message or image' }, { status: 400 });
    }

    // Enhanced system prompt for image handling
    const system = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math.';
    
    // Compose message with image context
    let userMessage = message || 'Please analyze the uploaded image and provide mathematical assistance.';
    let composed = `${system}\n\nUser: ${userMessage}`;
    
    let reply: string | null = null;
    
    try {
      if (imageData && imageName) {
        // For images, provide guidance since ChatGPT doesn't support image input in free tier
        reply = `I can see you've uploaded an image! 

Since I'm using ChatGPT (which doesn't support image analysis in the free tier), could you please:

1. **Describe what you see** in the image
2. **Tell me the specific question** or problem
3. **Share any equations or numbers** shown

I'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`;
      } else {
        // Use ChatGPT for text-only messages
        reply = await callChatGPT(userMessage);
      }
    } catch (error) {
      console.error('ChatGPT API call failed:', error);
      // Final fallback response
      reply = 'I\'m here to help with your GCSE Maths questions! Please ask me anything about mathematics, and I\'ll do my best to assist you.';
    }

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

// ChatGPT API function
async function callChatGPT(message: string): Promise<string> {
  try {
    console.log('Calling ChatGPT API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('ChatGPT response received');
      return data.choices[0]?.message?.content || 'I understand your question. Let me help you with that.';
    } else {
      console.error('ChatGPT API error:', response.status, response.statusText);
      throw new Error(`ChatGPT API error: ${response.status}`);
    }
  } catch (error) {
    console.error('ChatGPT API call failed:', error);
    throw error;
  }
}

// Alternative ChatGPT API call (fallback)
async function callAlternativeTextAPI(message: string): Promise<string> {
  try {
    console.log('Trying alternative ChatGPT API call...');
    return await callChatGPT(message);
  } catch (error) {
    console.error('Alternative ChatGPT call failed:', error);
    throw error;
  }
}

// Third alternative ChatGPT API call (final fallback)
async function callThirdAlternativeAPI(message: string): Promise<string> {
  try {
    console.log('Trying third alternative ChatGPT API call...');
    return await callChatGPT(message);
  } catch (error) {
    console.error('Third alternative ChatGPT call failed:', error);
    throw error;
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


