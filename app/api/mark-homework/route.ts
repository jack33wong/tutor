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

    // Stage 1: Simple OCR Simulation (for now, we'll use GPT-4o-mini to analyze the image directly)
    console.log('Starting AI analysis of homework image...');
    
    // Stage 2: GPT-4o-mini Analysis with image data
    const markingInstructions = await generateMarkingInstructions(imageData);
    
    if (!markingInstructions) {
      return NextResponse.json({ error: 'Failed to generate marking instructions' }, { status: 500 });
    }

    console.log(`AI analysis completed: ${markingInstructions.annotations.length} annotations generated`);

    // Stage 3: Image Annotation using Sharp
    console.log('Starting image annotation...');
    const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
    
    if (!markedImage) {
      return NextResponse.json({ error: 'Failed to apply markings to image' }, { status: 500 });
    }

    console.log('Image annotation completed successfully');

    return NextResponse.json({ 
      markedImage,
      instructions: markingInstructions,
      ocrResults: [], // We'll add OCR later when we fix the worker issues
      message: 'Homework marked successfully using AI analysis + Sharp image processing'
    });

  } catch (error) {
    console.error('Marking API error:', error);
    return NextResponse.json({ error: 'Failed to process homework marking' }, { status: 500 });
  }
}

async function generateMarkingInstructions(imageData: string): Promise<MarkingInstructions | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ] as any
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
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
    return null;
  }
}

async function applyMarkingsToImage(originalImage: string, instructions: MarkingInstructions): Promise<string | null> {
  try {
    console.log('Starting Sharp-based image annotation...');
    
    // Convert base64 to buffer
    const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create a new image with annotations using Sharp
    let markedImage = sharp(imageBuffer);
    
    // For now, we'll create a simple overlay with text
    // In a production system, you'd want more sophisticated annotation drawing
    
    // Create SVG overlay for annotations
    const svgOverlay = createSVGOverlay(instructions);
    
    if (svgOverlay) {
      markedImage = markedImage.composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }
      ]);
    }
    
    // Convert back to base64
    const outputBuffer = await markedImage.png().toBuffer();
    const base64Output = `data:image/png;base64,${outputBuffer.toString('base64')}`;
    
    console.log('Image annotation completed');
    return base64Output;

  } catch (error) {
    console.error('Error applying markings to image:', error);
    return null;
  }
}

function createSVGOverlay(instructions: MarkingInstructions): string | null {
  try {
    if (!instructions.annotations || instructions.annotations.length === 0) {
      return null;
    }

    // Create SVG with annotations
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" style="position: absolute; top: 0; left: 0;">`;
    
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
    return null;
  }
}
