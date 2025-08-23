import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface OCRResult {
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
}

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
    const { imageData, imageName }: { imageData: string; imageName: string } = await req.json();
    
    if (!imageData || !imageName) {
      return NextResponse.json({ error: 'Missing image data or name' }, { status: 400 });
    }



    // Stage 1: AI Analysis with GPT-5
    // Stage 2: GPT-5 Analysis with compressed image data
    const markingInstructions = await generateMarkingInstructions(imageData);
    
    if (!markingInstructions) {
      return NextResponse.json({ error: 'Failed to generate marking instructions' }, { status: 500 });
    }

    // Stage 3: Image Annotation using Sharp
    const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
    
    if (!markedImage) {
      return NextResponse.json({ error: 'Failed to apply markings to image' }, { status: 500 });
    }

    return NextResponse.json({ 
      markedImage,
      instructions: markingInstructions,
      message: 'Homework marked successfully using GPT-5 + Sharp image processing'
    });

  } catch (error) {
    console.error('Marking API error:', error);
    
    // Enhanced error logging
    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        // Include any additional details attached to the error
        additionalDetails: (error as any).details || null
      };
    }
    
    // Return detailed error information to help with debugging
    return NextResponse.json({ 
      error: 'Failed to process homework marking',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}





async function generateMarkingInstructions(imageData: string): Promise<MarkingInstructions | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
      return null;
    }

    // Compress and resize the image to reduce token usage
    const compressedImage = await compressImage(imageData);
    if (!compressedImage) {
      console.error('Failed to compress image');
      return null;
    }

    // Upload compressed image to temporary hosting for OpenAI API
    const imageUrl = await uploadImageToTempHost(compressedImage);
    if (!imageUrl) {
      console.error('Failed to upload image to temporary host');
      return null;
    }

    const systemPrompt = `You are a teacher marking student homework. 
You will receive an image of a student's math homework.

CRITICAL: Return ONLY raw JSON, no markdown formatting, no code blocks, no explanations.

Analyze the math and return structured annotation instructions for marking corrections directly on the image.

- Detect mathematical errors and provide helpful corrections
- Estimate positions for annotations (we'll place them appropriately)
- Output JSON only with this exact format

Example Output (return exactly this format, no markdown):
{
  "annotations": [
    {"action": "circle", "bbox": [100,50,180,80], "comment": "Check calculation"},
    {"action": "write", "bbox": [100,50,180,80], "comment": "Should be 19.6"},
    {"action": "tick", "bbox": [100,200,200,230], "comment": "Good work!"}
  ]
}

Available actions: circle, write, tick, cross, underline
IMPORTANT: Do NOT use markdown code blocks. Return ONLY the raw JSON object.`;

    const userPrompt = `Here is a student's homework image. Please analyze the math and provide annotation instructions for marking corrections.`;

    const requestBody = {
      model: "gpt-5", // could also be "gpt-5-mini" or "gpt-5-nano" depending on availability
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
                url: imageUrl, // Use the uploaded image URL instead of base64
              },
            },
          ],
        },
      ],
      max_completion_tokens: 1000,
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
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      console.error('OpenAI API error response:', errorDetails);
      
      if (errorData.error?.code === 'invalid_api_key') {
        const error = new Error('Invalid OpenAI API key. Please check your API key configuration.');
        (error as any).details = errorDetails;
        throw error;
      } else if (errorData.error?.message) {
        const error = new Error(`OpenAI API error: ${errorData.error.message}`);
        (error as any).details = errorDetails;
        throw error;
      } else {
        const error = new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        (error as any).details = errorDetails;
        throw error;
      }
    }

    const data = await response.json();

    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response');
      return null;
    }

    // Parse the JSON response
    try {
      const instructions = JSON.parse(content);
      return instructions;
    } catch (parseError) {
      console.error('Failed to parse marking instructions:', parseError);
      
      // Try to extract JSON from markdown code blocks if the AI still returns them
      try {
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          console.log('Extracting JSON from markdown code block');
          const extractedJson = jsonMatch[1];
          const instructions = JSON.parse(extractedJson);
          return instructions;
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from markdown:', extractError);
      }
      
      return null;
    }

  } catch (error) {
    console.error('Error generating marking instructions:', error);
    
    // Enhanced error logging for debugging
    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        // Include any additional details attached to the error
        additionalDetails: (error as any).details || null
      };
      console.error('Marking instructions error details:', errorDetails);
    }
    
    // Instead of returning null, throw the error with details so it can be caught by the main handler
    const enhancedError = new Error(`Failed to generate marking instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    (enhancedError as any).details = errorDetails;
    throw enhancedError;
  }
}

async function applyMarkingsToImage(originalImage: string, instructions: MarkingInstructions): Promise<string | null> {
  try {
    console.log('Starting Sharp-based image annotation...');
    console.log('Instructions received:', JSON.stringify(instructions, null, 2));
    
    // Convert base64 to buffer
    const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log('Image buffer created, size:', imageBuffer.length);
    
    // Test Sharp functionality
    try {
      const testSharp = sharp(imageBuffer);
      console.log('Sharp instance created successfully');
    } catch (sharpError) {
      console.error('Sharp initialization error:', sharpError);
      throw sharpError;
    }
    
    // Create a new image with annotations using Sharp
    let markedImage = sharp(imageBuffer);
    console.log('Marked image Sharp instance created');
    
    // For now, we'll create a simple overlay with text
    // In a production system, you'd want more sophisticated annotation drawing
    
    // Get image dimensions
    const imageMetadata = await markedImage.metadata();
    console.log('Image metadata:', imageMetadata);
    
    // Create SVG overlay for annotations with correct dimensions
    const svgOverlay = createSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
    console.log('SVG overlay created:', svgOverlay ? 'yes' : 'no');
    
    if (svgOverlay) {
      console.log('SVG overlay length:', svgOverlay.length);
          try {
      markedImage = markedImage.composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }
      ]);
    } catch (compositeError) {
      console.error('SVG composite error:', compositeError);
      throw compositeError;
    }
  }
  
  // Convert back to base64
  const outputBuffer = await markedImage.png().toBuffer();
  
  const base64Output = `data:image/png;base64,${outputBuffer.toString('base64')}`;
  
  return base64Output;

  } catch (error) {
    console.error('Error applying markings to image:', error);
    
    // Enhanced error logging
    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
      console.error('Image processing error details:', errorDetails);
    }
    
    // Instead of returning null, throw the error with details so it can be caught by the main handler
    const enhancedError = new Error(`Failed to apply markings to image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    (enhancedError as any).details = errorDetails;
    throw enhancedError;
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
    console.error('Error creating SVG overlay:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('SVG creation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return null;
  }
}

async function compressImage(imageData: string): Promise<string | null> {
  try {
    // Remove data URL prefix
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Compress and resize image to reduce token usage
    const compressedBuffer = await sharp(imageBuffer)
      .resize(400, 300, { fit: 'inside', withoutEnlargement: true }) // Resize to max 400x300
      .jpeg({ quality: 50 }) // Compress with 50% quality
      .toBuffer();
    
    // Convert back to base64
    const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    
    return compressedBase64;
    
  } catch (error) {
    console.error('Error compressing image:', error);
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
    console.error('Error uploading image to temp host:', error);
    return null;
  }
}
