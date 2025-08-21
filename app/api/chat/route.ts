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
        // For images, try Gemini first (which supports image analysis), then fallback to ChatGPT
        try {
          reply = await callGeminiWithImage(userMessage, imageData, imageName);
        } catch (geminiError) {
          console.log('Gemini image analysis failed, trying ChatGPT...');
          try {
            reply = await callChatGPT(userMessage);
          } catch (chatgptError) {
            console.error('Both Gemini and ChatGPT failed:', { geminiError, chatgptError });
            // Final fallback for images
            reply = `I can see you've uploaded an image! 

Since both AI services are having issues, could you please:

1. **Describe what you see** in the image
2. **Tell me the specific question** or problem
3. **Share any equations or numbers** shown

I'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`;
          }
        }
      } else {
        // Try Gemini first, then fallback to ChatGPT
        try {
          reply = await callGemini(userMessage);
        } catch (geminiError) {
          console.log('Gemini failed, trying ChatGPT...');
          try {
            reply = await callChatGPT(userMessage);
          } catch (chatgptError) {
            console.error('Both Gemini and ChatGPT failed:', { geminiError, chatgptError });
            throw new Error('All AI services unavailable');
          }
        }
      }
    } catch (error) {
      console.error('All AI API calls failed:', error);
      // Final fallback response
      reply = 'I\'m here to help with your GCSE Maths questions! Please ask me anything about mathematics, and I\'ll do my best to assist you.';
    }

    if (!reply) {
      reply = 'Thanks for your question! Could you share the key steps you tried so far? Focus on units and ensure operations are applied in the correct order.';
    }

    // Normalize LaTeX formatting for better rendering
    reply = normalizeLatex(reply);

    // Format the reply with Question and Answer template
    const formattedReply = formatChatReply(userMessage, reply);

    return NextResponse.json({ reply: formattedReply });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

// Format chat reply with Question and Answer template
function formatChatReply(userMessage: string, aiReply: string): string {
  // Clean up the user message for display
  const question = userMessage.trim();
  
  // Clean up the AI reply
  const answer = aiReply.trim();
  
  // Format with bold labels and proper spacing with extra line before Answer
  return `**Question:**\n\n${question}\n\n---\n\n\n**Answer:**\n\n${answer}`;
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
            content: 'You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.'
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

// Gemini API function
async function callGemini(message: string): Promise<string> {
  try {
    console.log('Calling Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.

User question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Gemini response received');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I understand your question. Let me help you with that.';
    } else {
      console.error('Gemini API error:', response.status, response.statusText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Gemini API function with image support
async function callGeminiWithImage(message: string, imageData: string, imageName: string): Promise<string> {
  try {
    console.log('Calling Gemini API with image...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.

User question: ${message}

Please analyze the uploaded image and provide mathematical assistance.`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData.split(',')[1] // Remove the "data:image/jpeg;base64," prefix
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Gemini image response received');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I can see the image! Let me analyze it and help you with the mathematical problem.';
    } else {
      console.error('Gemini image API error:', response.status, response.statusText);
      throw new Error(`Gemini image API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Gemini image API call failed:', error);
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


