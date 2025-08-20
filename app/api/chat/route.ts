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
    
    if (imageData && imageName) {
      // Add image context to the message
      composed += `\n\n[Image Analysis Request]
The user has uploaded an image named "${imageName}". 
Please analyze this image and provide mathematical assistance based on what you can see.
If the image contains mathematical problems, equations, graphs, or diagrams, please help solve or explain them.
If you cannot see the image content, ask the user to describe what they see or what specific help they need.`;
    }

    let reply: string | null = null;
    
    try {
      if (imageData && imageName) {
        // Try Hugging Face multimodal model first
        try {
          reply = await callHuggingFaceMultimodal(composed, imageData);
        } catch (error) {
          console.log('Hugging Face multimodal failed, trying alternative...');
          // Fallback to text-only with image context
          reply = await callHuggingFaceText(composed + '\n\n[Note: An image was uploaded but could not be processed. Please describe what you see.]');
        }
      } else {
        // Use Hugging Face text model for text-only
        reply = await callHuggingFaceText(composed);
      }
    } catch (error) {
      console.error('AI API call failed:', error);
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

// Hugging Face API functions
async function callHuggingFaceText(message: string): Promise<string> {
  try {
    // Use a free, open-source text model
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No API key required for basic usage (rate limited but free)
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          do_sample: true
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data[0]?.generated_text || 'I understand your question. Let me help you with that.';
    } else {
      console.error('Hugging Face text API error:', response.status, response.statusText);
      return 'I\'m here to help with your maths questions. Could you please rephrase that?';
    }
  } catch (error) {
    console.error('Hugging Face text API call failed:', error);
    return 'I\'m having trouble processing your request right now. Please try again.';
  }
}

async function callHuggingFaceMultimodal(message: string, imageData: string): Promise<string> {
  try {
    // Process image data - remove data URL prefix and validate
    const base64Data = imageData.split(',')[1]; // Remove data:image/...;base64, prefix
    if (!base64Data) {
      throw new Error('Invalid image data format');
    }

    // Use a free multimodal model that can handle images and text
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/git-base-coco', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No API key required for basic usage (rate limited but free)
      },
      body: JSON.stringify({
        inputs: {
          text: message,
          image: base64Data
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      let responseText = data[0]?.generated_text || 'I can see the image you uploaded. Let me analyze it and provide mathematical assistance.';
      
      // Enhance the response for mathematical context
      if (responseText.toLowerCase().includes('math') || responseText.toLowerCase().includes('equation') || 
          responseText.toLowerCase().includes('problem') || responseText.toLowerCase().includes('solve')) {
        responseText += '\n\nI can see mathematical content in your image. Please let me know if you need help with specific calculations or concepts!';
      }
      
      return responseText;
    } else {
      console.error('Hugging Face multimodal API error:', response.status, response.statusText);
      return 'I can see your image, but I\'m having trouble analyzing it right now. Could you describe what you see?';
    }
  } catch (error) {
    console.error('Hugging Face multimodal API call failed:', error);
    return 'I\'m having trouble processing your image right now. Please try again or describe what you see.';
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


