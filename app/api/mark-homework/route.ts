import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface Annotation {
  action: 'circle' | 'write' | 'tick' | 'cross' | 'underline';
  bbox: [number, number, number, number];
  comment: string;
}

interface MarkingInstructions {
  annotations: Annotation[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageData, imageName, model } = body;
    
    console.log('🔍 Mark Homework API - Model Selection:', { 
      model, 
      hasModel: !!model, 
      modelType: typeof model 
    });
    
    if (!imageData || !imageName) {
      return NextResponse.json({ error: 'Missing image data or name' }, { status: 400 });
    }



    // Stage 1: AI Analysis with selected model
    // Stage 2: AI Analysis with compressed image data
    const markingInstructions = await generateMarkingInstructions(imageData, model);
    
    if (!markingInstructions) {
      return NextResponse.json({ 
        markedImage: null,
        instructions: {
          annotations: [
            {
              action: 'write',
              bbox: [50, 50, 400, 100],
              comment: 'AI service temporarily unavailable. Please try again later.'
            }
          ]
        },
        message: 'AI analysis service unavailable. Please try again later.',
        error: 'AI Service Unavailable',
        details: 'OpenAI API did not return content. This could be due to API key issues, model availability, or service problems.'
      });
    }

    // Stage 3: Image Annotation using Sharp
    const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
    
    if (!markedImage) {
      return NextResponse.json({ error: 'Failed to apply markings to image' }, { status: 500 });
    }

    const modelName = model === 'gemini-2.5-pro' ? 'Google Gemini 2.5 Pro' : 
                     model === 'chatgpt-5' ? 'OpenAI ChatGPT 5' : 'OpenAI GPT-4 Omni';
    return NextResponse.json({ 
      markedImage,
      instructions: markingInstructions,
      message: `Homework marked successfully using ${modelName} + Sharp image processing`
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process homework marking',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}





async function generateMarkingInstructions(imageData: string, model?: string): Promise<MarkingInstructions | null> {
  try {
    // Compress and resize the image to reduce token usage
    const compressedImage = await compressImage(imageData);
    if (!compressedImage) {
      return null;
    }

    // For development, use base64 data directly instead of uploading to temp host
    // In production, you'd want to use a proper image hosting service
    const imageUrl = compressedImage; // Use base64 data directly

    const systemPrompt = `You are an AI assistant analyzing images. 
You will receive an image and your task is to:

1. Analyze the image content
2. Provide marking annotations if it's math homework, or general feedback if not

CRITICAL: Return ONLY raw JSON, no markdown formatting, no code blocks, no explanations.

Output JSON only with this exact format:

Example Output for Math Homework (return exactly this format, no markdown):
{
  "annotations": [
    {"action": "tick", "bbox": [50, 80, 200, 150], "comment": "Correct solution"},
    {"action": "write", "bbox": [50, 160, 200, 180], "comment": "Good work!"}
  ]
}

Example Output for Non-Math Content (return exactly this format, no markdown):
{
  "annotations": [
    {"action": "write", "bbox": [50, 50, 400, 100], "comment": "This is a computer screenshot. Please upload a photo of math homework instead."}
  ]
}

Available actions: circle, write, tick, cross, underline
IMPORTANT: Do NOT use markdown code blocks. Return ONLY the raw JSON object.`;

    const userPrompt = `Here is an uploaded image. Please:

1. Analyze the image content
2. If it's math homework, provide marking annotations
3. If it's not math homework, provide appropriate feedback

Focus on providing clear, actionable annotations with bounding boxes and comments.`;

    // Route to appropriate API based on selected model
    if (model === 'gemini-2.5-pro') {
      return await callGeminiForMarking(imageUrl, systemPrompt, userPrompt);
    } else if (model === 'chatgpt-5') {
      return await callOpenAIForMarking(imageUrl, systemPrompt, userPrompt, 'gpt-5');
    } else {
      // Default to ChatGPT 4o
      return await callOpenAIForMarking(imageUrl, systemPrompt, userPrompt, 'gpt-4o');
    }

  } catch (error) {
    throw new Error(`Failed to generate marking instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// OpenAI API function for marking
async function callOpenAIForMarking(imageUrl: string, systemPrompt: string, userPrompt: string, openaiModel: string = 'gpt-4o'): Promise<MarkingInstructions | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🔍 OpenAI API Request - Model Selection:', { 
    userSelectedModel: openaiModel === 'gpt-5' ? 'chatgpt-5' : 'chatgpt-4o', 
    openaiModel: openaiModel,
    isChatGPT: true
  });
  
  const requestBody = {
    model: openaiModel, // Use the specified OpenAI model
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl, // Using base64 data directly
            },
          },
        ],
      },
    ],
    max_completion_tokens: 8000,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    if (errorData.error?.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
    } else if (errorData.error?.message) {
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    } else {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    return null;
  }

  // Parse the JSON response
  try {
    const instructions = JSON.parse(content);
    return instructions;
  } catch (parseError) {
    // Try to extract JSON from markdown code blocks if the AI still returns them
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[1];
        const instructions = JSON.parse(extractedJson);
        return instructions;
      }
    } catch (extractError) {
      // JSON extraction failed, continue to next method
    }
    
    return null;
  }
}

// Gemini API function for marking
async function callGeminiForMarking(imageUrl: string, systemPrompt: string, userPrompt: string): Promise<MarkingInstructions | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  console.log('🔍 Gemini API Request - Model Selection:', { 
    userSelectedModel: 'gemini', 
    geminiModel: 'gemini-2.0-flash-exp',
    isGemini: true
  });

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\n${userPrompt}`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageUrl.replace('data:image/jpeg;base64,', '') // Remove data URL prefix
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8000,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API error:', response.status, response.statusText, errorData);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    return null;
  }

  // Parse the JSON response
  try {
    const instructions = JSON.parse(content);
    return instructions;
  } catch (parseError) {
    // Try to extract JSON from markdown code blocks if the AI still returns them
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[1];
        const instructions = JSON.parse(extractedJson);
        return instructions;
      }
    } catch (extractError) {
      // JSON extraction failed, continue to next method
    }
    
    return null;
  }
}

async function applyMarkingsToImage(originalImage: string, instructions: MarkingInstructions): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Test Sharp functionality
    try {
      const testSharp = sharp(imageBuffer);
    } catch (sharpError) {
      throw sharpError;
    }
    
    // Create a new image with annotations using Sharp
    let markedImage = sharp(imageBuffer);
    
    // For now, we'll create a simple overlay with text
    // In a production system, you'd want more sophisticated annotation drawing
    
    // Get image dimensions
    const imageMetadata = await markedImage.metadata();
    
    // Create SVG overlay for annotations with correct dimensions
    const svgOverlay = createSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
    
    if (svgOverlay) {
          try {
      markedImage = markedImage.composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }
      ]);
    } catch (compositeError) {
      throw compositeError;
    }
  }
  
  // Convert back to base64
  const outputBuffer = await markedImage.png().toBuffer();
  
  const base64Output = `data:image/png;base64,${outputBuffer.toString('base64')}`;
  
  return base64Output;

  } catch (error) {
    throw new Error(`Failed to apply markings to image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function createSVGOverlay(instructions: MarkingInstructions, imageWidth: number = 400, imageHeight: number = 300): string | null {
  try {
    if (!instructions.annotations || instructions.annotations.length === 0) {
      return null;
    }

    // Create SVG with annotations - use actual image dimensions
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" style="position: absolute; top: 0; left: 0;">`;
    
    instructions.annotations.forEach((annotation, index) => {
      const [x0, y0, x1, y1] = annotation.bbox;
      const centerX = (x0 + x1) / 2;
      const centerY = (y0 + y1) / 2;
      const width = x1 - x0;
      const height = y1 - y0;
      
      switch (annotation.action) {
        case 'circle':
          svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${width/2 + 5}" ry="${height/2 + 5}" fill="none" stroke="red" stroke-width="3"/>`;
          break;
          
        case 'write':
          svg += `<text x="${x0}" y="${y0 - 10}" fill="red" font-family="Arial" font-size="16" font-weight="bold">${annotation.comment}</text>`;
          break;
          
        case 'tick':
          svg += `<path d="M ${x0 - 10} ${y0 + height/2} L ${centerX} ${y1 + 10} L ${x1 + 10} ${y0 - 5}" stroke="red" stroke-width="3" fill="none"/>`;
          break;
          
        case 'cross':
          svg += `<path d="M ${x0 - 5} ${y0 - 5} L ${x1 + 5} ${y1 + 5} M ${x1 + 5} ${y0 - 5} L ${x0 - 5} ${y1 + 5}" stroke="red" stroke-width="3"/>`;
          break;
          
        case 'underline':
          svg += `<line x1="${x0}" y1="${y1 + 5}" x2="${x1}" y2="${y1 + 5}" stroke="red" stroke-width="3"/>`;
          break;
      }
    });
    
    svg += '</svg>';
    return svg;

  } catch (error) {
    return null;
  }
}

async function compressImage(imageData: string): Promise<string | null> {
  try {
    // Validate input format
    if (!imageData || typeof imageData !== 'string') {
      return null;
    }

    // Check if it's a valid data URL
    if (!imageData.startsWith('data:image/')) {
      return null;
    }

    // Extract format and base64 data
    const match = imageData.match(/^data:image\/([a-z]+);base64,(.+)$/i);
    if (!match) {
      return null;
    }

    const [, format, base64Data] = match;
    
    // Check if base64 data is valid (not test data)
    if (!base64Data || base64Data === 'test') {
      return null;
    }

    // Allow very small images (canvas-generated images can be small)
    if (base64Data.length < 50) {
      return null;
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      return null;
    }

    let imageBuffer: Buffer | undefined;
    try {
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Validate buffer size
      if (imageBuffer.length === 0) {
        return null;
      }

      // For very small images (like 1x1 pixel), don't compress - just return original
      if (imageBuffer.length < 100) {
        return imageData;
      }

      // Try to compress with Sharp
      const compressedBuffer = await sharp(imageBuffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true }) // Larger size for better quality
        .jpeg({ quality: 80 }) // Higher quality
        .toBuffer();
      
      // Convert back to base64
      const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      
      return compressedBase64;
      
    } catch (sharpError) {
      // If Sharp fails but it's a valid format, try to return original
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'];
      if (validFormats.includes(format.toLowerCase())) {
        return imageData;
      }
      
      return null;
    }
    
  } catch (error) {
    return null;
  }
}

async function uploadImageToTempHost(base64Image: string): Promise<string | null> {
  try {
    // For development/testing, we'll use a simple approach
    // In production, you'd want to use a proper image hosting service like AWS S3, Cloudinary, etc.
    
    // Option 1: Use a free image hosting service (requires API key)
    // Option 2: Use a public image hosting service
    // Option 3: For now, return a test URL to verify the API structure
    
    // For testing purposes, we'll use a placeholder URL
    // This will allow us to test the API structure, but OpenAI will reject it
    // You'll need to implement proper image hosting for production use
    
    const testUrl = 'https://httpbin.org/image/jpeg'; // A test image URL
    
    return testUrl;
    
  } catch (error) {
    return null;
  }
}
