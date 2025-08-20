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

// AI API functions with multiple free AI engines
async function callHuggingFaceText(message: string): Promise<string> {
  try {
    console.log('Attempting Hugging Face text API...');
    
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

    console.log('Hugging Face response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Hugging Face response data:', data);
      return data[0]?.generated_text || 'I understand your question. Let me help you with that.';
    } else {
      console.error('Hugging Face text API error:', response.status, response.statusText);
      // Try alternative free API
      return await callAlternativeTextAPI(message);
    }
  } catch (error) {
    console.error('Hugging Face text API call failed:', error);
    // Try alternative free API
    return await callAlternativeTextAPI(message);
  }
}

// Alternative free AI engine (using public models that don't require tokens)
async function callAlternativeTextAPI(message: string): Promise<string> {
  try {
    console.log('Attempting alternative free AI API...');
    
    // Use a different free Hugging Face model that's more reliable
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/opt-1.3b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `You are a GCSE Maths tutor. Answer this question: ${message}`,
        parameters: {
          max_length: 400,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        }
      })
    });

    console.log('Alternative API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Alternative API response data:', data);
      
      if (data[0]?.generated_text) {
        // Clean up the response to remove the prompt
        let responseText = data[0].generated_text;
        if (responseText.includes('You are a GCSE Maths tutor. Answer this question:')) {
          responseText = responseText.split('You are a GCSE Maths tutor. Answer this question:')[1]?.trim() || responseText;
        }
        return responseText || 'I understand your question. Let me help you with that.';
      } else {
        return 'I understand your question. Let me help you with that.';
      }
    } else {
      console.error('Alternative API error:', response.status, response.statusText);
      // Try another free alternative
      return await callThirdAlternativeAPI(message);
    }
  } catch (error) {
    console.error('Alternative API call failed:', error);
    // Try another free alternative
    return await callThirdAlternativeAPI(message);
  }
}



// Third alternative: Use a completely free text generation service
async function callThirdAlternativeAPI(message: string): Promise<string> {
  try {
    console.log('Attempting third alternative API...');
    
    // Use a completely free text generation service
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/opt-350m', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `You are a GCSE Maths tutor. Answer: ${message}`,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          do_sample: true
        }
      })
    });

    console.log('Third API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Third API response data:', data);
      
      if (data[0]?.generated_text) {
        // Clean up the response to remove the prompt
        let responseText = data[0].generated_text;
        if (responseText.includes('You are a GCSE Maths tutor. Answer:')) {
          responseText = responseText.split('You are a GCSE Maths tutor. Answer:')[1]?.trim() || responseText;
        }
        return responseText || 'I understand your question. Let me help you with that.';
      } else {
        return 'I understand your question. Let me help you with that.';
      }
    } else {
      console.error('Third API error:', response.status, response.statusText);
      // Provide a helpful default response
      return generateDefaultMathResponse(message);
    }
  } catch (error) {
    console.error('Third API call failed:', error);
    // Provide a helpful default response
    return generateDefaultMathResponse(message);
  }
}

// Generate helpful default responses for maths questions
function generateDefaultMathResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // More specific topic detection
  if (lowerMessage.includes('equation') || lowerMessage.includes('solve') || lowerMessage.includes('=')) {
    return 'I can help you with solving equations! For GCSE Maths, remember to:\n\n1. **Collect like terms** on each side\n2. **Use inverse operations** to isolate the variable\n3. **Check your answer** by substituting back\n\nCould you share the specific equation you\'re working with?';
  }
  
  if (lowerMessage.includes('fraction') || lowerMessage.includes('fractions') || lowerMessage.includes('/')) {
    return 'Fractions can be tricky! Here are some key GCSE concepts:\n\n1. **Adding/Subtracting**: Find common denominators\n2. **Multiplying**: Multiply numerators and denominators\n3. **Dividing**: Flip the second fraction and multiply\n\nWhat specific fraction problem are you stuck on?';
  }
  
  if (lowerMessage.includes('algebra') || lowerMessage.includes('algebraic') || lowerMessage.includes('x') || lowerMessage.includes('y')) {
    return 'Algebra is fundamental to GCSE Maths! Key areas include:\n\n1. **Expanding brackets** using FOIL method\n2. **Factorising** expressions\n3. **Solving equations** step by step\n\nWhich algebraic concept would you like help with?';
  }
  
  if (lowerMessage.includes('geometry') || lowerMessage.includes('shape') || lowerMessage.includes('area') || lowerMessage.includes('perimeter') || lowerMessage.includes('volume')) {
    return 'Geometry is all about shapes and space! Important GCSE topics:\n\n1. **Area and perimeter** of 2D shapes\n2. **Volume and surface area** of 3D shapes\n3. **Angles** and their properties\n\nWhat geometric problem are you working on?';
  }
  
  if (lowerMessage.includes('statistics') || lowerMessage.includes('data') || lowerMessage.includes('graph') || lowerMessage.includes('mean') || lowerMessage.includes('median') || lowerMessage.includes('probability')) {
    return 'Statistics helps us understand data! GCSE focuses on:\n\n1. **Mean, median, mode** calculations\n2. **Reading and interpreting** graphs\n3. **Probability** basics\n\nWhat statistical question do you have?';
  }
  
  if (lowerMessage.includes('trigonometry') || lowerMessage.includes('sin') || lowerMessage.includes('cos') || lowerMessage.includes('tan')) {
    return 'Trigonometry is essential for GCSE Maths! Key concepts include:\n\n1. **SOHCAHTOA** for right-angled triangles\n2. **Sine and cosine rules** for any triangle\n3. **Special angles** (30°, 45°, 60°)\n\nWhat trigonometry problem are you working on?';
  }
  
  if (lowerMessage.includes('quadratic') || lowerMessage.includes('x²') || lowerMessage.includes('x^2')) {
    return 'Quadratic equations are a key GCSE topic! Remember:\n\n1. **Factorising** when possible\n2. **Quadratic formula** when factorising fails\n3. **Completing the square** as an alternative\n\nWhat quadratic equation are you trying to solve?';
  }
  
  // More dynamic default response based on message content
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('problem')) {
    return 'I can see you need help with GCSE Maths! Let me guide you:\n\n• What specific topic are you studying?\n• Can you share the question or problem?\n• What have you tried so far?\n\nI\'m here to help you understand and solve any mathematical concept!';
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('start')) {
    return 'Hello! I\'m your GCSE Maths tutor. I can help you with:\n\n• **Algebra** - equations, expressions, factorising\n• **Geometry** - shapes, areas, angles\n• **Fractions** - operations and problem solving\n• **Statistics** - data analysis and probability\n• **And much more!**\n\nWhat would you like to learn about today?';
  }
  
  // Generic but varied response
  const responses = [
    'I\'m here to help with GCSE Maths! What specific topic or problem would you like assistance with?',
    'Great question! I can help you with GCSE Maths. Could you tell me more about what you\'re working on?',
    'I\'m your GCSE Maths tutor and ready to help! What mathematical concept are you studying?',
    'Excellent! I can assist with GCSE Maths. What specific area would you like to explore?'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

async function callHuggingFaceMultimodal(message: string, imageData: string): Promise<string> {
  try {
    console.log('Attempting Hugging Face multimodal API...');
    
    // Process image data - remove data URL prefix and validate
    const base64Data = imageData.split(',')[1]; // Remove data:image/...;base64, prefix
    if (!base64Data) {
      throw new Error('Invalid image data format');
    }

    console.log('Image data processed, length:', base64Data.length);

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

    console.log('Multimodal API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Multimodal API response data:', data);
      
      let responseText = data[0]?.generated_text || 'I can see the image you uploaded. Let me analyze it and provide mathematical assistance.';
      
      // Enhance the response for mathematical context
      if (responseText.toLowerCase().includes('math') || responseText.toLowerCase().includes('equation') || 
          responseText.toLowerCase().includes('problem') || responseText.toLowerCase().includes('solve')) {
        responseText += '\n\nI can see mathematical content in your image. Please let me know if you need help with specific calculations or concepts!';
      }
      
      return responseText;
    } else {
      console.error('Hugging Face multimodal API error:', response.status, response.statusText);
      // Try alternative multimodal API
      return await callAlternativeMultimodalAPI(message, imageData);
    }
  } catch (error) {
    console.error('Hugging Face multimodal API call failed:', error);
    // Try alternative multimodal API
    return await callAlternativeMultimodalAPI(message, imageData);
  }
}

// Alternative multimodal API using Replicate's free tier
async function callAlternativeMultimodalAPI(message: string, imageData: string): Promise<string> {
  try {
    console.log('Attempting Replicate multimodal API...');
    
    // Process image data
    const base64Data = imageData.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid image data format');
    }

    // Use Replicate's free multimodal model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN || 'r8_...'}`
      },
      body: JSON.stringify({
        version: "yorickvp/llava-13b:e272157381e2a3bf12df3a8edd1f38d1dbd73659b0c0d2c0d2c0d2c0d2c0d2c0d2c",
        input: {
          image: `data:image/jpeg;base64,${base64Data}`,
          prompt: `You are a GCSE Maths tutor. Analyze this image and answer: ${message}. If you see mathematical content, explain it clearly.`,
          max_tokens: 500,
          temperature: 0.7
        }
      })
    });

    console.log('Replicate multimodal API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Replicate multimodal API response data:', data);
      
      if (data.id) {
        return await pollReplicateResult(data.id);
      } else {
        return 'I can see your image. Let me analyze it and provide mathematical assistance.';
      }
    } else {
      console.error('Replicate multimodal API error:', response.status, response.statusText);
      // Try another multimodal alternative
      return await callThirdMultimodalAPI(message, imageData);
    }
  } catch (error) {
    console.error('Replicate multimodal API call failed:', error);
    // Try another multimodal alternative
    return await callThirdMultimodalAPI(message, imageData);
  }
}

// Third multimodal alternative: Use a different free image analysis service
async function callThirdMultimodalAPI(message: string, imageData: string): Promise<string> {
  try {
    console.log('Attempting third multimodal API...');
    
    // Use a different free multimodal model
    const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imageData
      })
    });

    console.log('Third multimodal API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Third multimodal API response data:', data);
      
      const imageDescription = data[0]?.generated_text || 'an image';
      
      return `I can see your image which appears to show: ${imageDescription}. 

Since I'm having trouble analyzing the mathematical content directly, could you please:

1. **Describe what mathematical problem** you see in the image
2. **Tell me the specific question** you need help with
3. **Share any equations or numbers** shown

I'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`;
    } else {
      console.error('Third multimodal API error:', response.status, response.statusText);
      // Provide helpful fallback
      return await handleImageAnalysisFallback(message, imageData);
    }
  } catch (error) {
    console.error('Third multimodal API call failed:', error);
    // Provide helpful fallback
    return await handleImageAnalysisFallback(message, imageData);
  }
}

// Fallback for image analysis when multimodal API fails
async function handleImageAnalysisFallback(message: string, imageData: string): Promise<string> {
  try {
    console.log('Attempting image analysis fallback...');
    
    // Provide helpful guidance based on the message context
    if (message.toLowerCase().includes('math') || message.toLowerCase().includes('equation') || 
        message.toLowerCase().includes('problem') || message.toLowerCase().includes('solve')) {
      return `I can see you've uploaded an image with a mathematical problem! 

Since I'm having trouble analyzing the image directly, could you please:

1. **Describe what you see** in the image
2. **Tell me the specific question** or problem
3. **Share any equations** or numbers shown

I'm here to help with GCSE Maths and can guide you through solving:
• Algebraic equations
• Geometry problems  
• Fraction calculations
• Statistics questions
• And much more!

What mathematical concept are you working on?`;
    }
    
    // Generic image guidance
    return `I can see you've uploaded an image! 

To help you best, please describe:
• What the image shows
• What question you have
• What you'd like help with

I'm your GCSE Maths tutor and ready to assist with any mathematical concepts!`;
    
  } catch (error) {
    console.error('Image analysis fallback failed:', error);
    return 'I can see your image, but I\'m having trouble analyzing it right now. Please describe what you see and I\'ll be happy to help with your maths question!';
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


