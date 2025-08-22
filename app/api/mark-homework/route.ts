import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

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

    // Stage 1: OCR Extraction
    console.log('Starting OCR extraction...');
    const ocrResults = await performOCR(imageData);
    
    if (!ocrResults || ocrResults.length === 0) {
      return NextResponse.json({ error: 'Failed to extract text from image' }, { status: 500 });
    }

    console.log(`OCR completed: ${ocrResults.length} text elements found`);

    // Stage 2: GPT-4 Analysis with OCR data
    console.log('Starting AI analysis...');
    const markingInstructions = await generateMarkingInstructions(ocrResults);
    
    if (!markingInstructions) {
      return NextResponse.json({ error: 'Failed to generate marking instructions' }, { status: 500 });
    }

    console.log(`AI analysis completed: ${markingInstructions.annotations.length} annotations generated`);

    // Stage 3: Direct Image Annotation
    console.log('Starting image annotation...');
    const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
    
    if (!markedImage) {
      return NextResponse.json({ error: 'Failed to apply markings to image' }, { status: 500 });
    }

    console.log('Image annotation completed successfully');

    return NextResponse.json({ 
      markedImage,
      instructions: markingInstructions,
      ocrResults: ocrResults,
      message: 'Homework marked successfully using OCR + AI analysis'
    });

  } catch (error) {
    console.error('Marking API error:', error);
    return NextResponse.json({ error: 'Failed to process homework marking' }, { status: 500 });
  }
}

async function performOCR(imageData: string): Promise<OCRResult[]> {
  try {
    console.log('Initializing Tesseract OCR...');
    
    const result = await Tesseract.recognize(
      imageData,
      'eng',
      {
        logger: m => console.log('OCR Progress:', m.status, m.progress),
        errorHandler: e => console.error('OCR Error:', e)
      }
    );

    console.log('OCR recognition completed');
    
    // Extract text with bounding boxes and confidence
    const ocrResults: OCRResult[] = [];
    
    // Tesseract result structure varies, try different approaches
    const data = result.data as any; // Type assertion to handle Tesseract result structure
    
    if (data.words && Array.isArray(data.words)) {
      data.words.forEach((word: any) => {
        if (word.text?.trim() && word.confidence > 30) {
          ocrResults.push({
            text: word.text.trim(),
            bbox: [
              word.bbox?.x0 || 0,
              word.bbox?.y0 || 0,
              word.bbox?.x1 || 0,
              word.bbox?.y1 || 0
            ],
            confidence: word.confidence
          });
        }
      });
    } else if (data.lines && Array.isArray(data.lines)) {
      // Fallback to lines if words not available
      data.lines.forEach((line: any) => {
        if (line.text?.trim() && line.confidence > 30) {
          ocrResults.push({
            text: line.text.trim(),
            bbox: [
              line.bbox?.x0 || 0,
              line.bbox?.y0 || 0,
              line.bbox?.x1 || 0,
              line.bbox?.y1 || 0
            ],
            confidence: line.confidence
          });
        }
      });
    }

    console.log(`OCR extracted ${ocrResults.length} text elements`);
    return ocrResults;

  } catch (error) {
    console.error('OCR Error:', error);
    return [];
  }
}

async function generateMarkingInstructions(ocrResults: OCRResult[]): Promise<MarkingInstructions | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
      return null;
    }

    // Create OCR summary for GPT
    const ocrSummary = ocrResults.map(result => 
      `"${result.text}" at position [${result.bbox.join(', ')}]`
    ).join('\n');

    const systemPrompt = `You are a teacher marking student homework. 
You will receive OCR text with bounding box coordinates from a student's math homework.

CRITICAL: Return ONLY raw JSON, no markdown formatting, no code blocks, no explanations.

Analyze the math and return structured annotation instructions for marking corrections directly on the image.

- Use the provided OCR coordinates (bbox) to place annotations precisely
- Detect mathematical errors and provide helpful corrections
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

    const userPrompt = `Here is the OCR text from a student's homework with bounding box coordinates:

${ocrSummary}

Please analyze the math and provide annotation instructions. Use the exact bbox coordinates provided.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
    console.log('Starting direct image annotation...');
    
    // Create a canvas to draw on the original image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }

    // Load the original image
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply annotations
        instructions.annotations.forEach((annotation, index) => {
          const [x0, y0, x1, y1] = annotation.bbox;
          const centerX = (x0 + x1) / 2;
          const centerY = (y0 + y1) / 2;
          const width = x1 - x0;
          const height = y1 - y0;
          
          // Set red color for all annotations
          ctx.strokeStyle = '#FF0000';
          ctx.fillStyle = '#FF0000';
          ctx.lineWidth = 3;
          ctx.font = 'bold 16px Arial';
          
          switch (annotation.action) {
            case 'circle':
              // Draw ellipse around the bounding box
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, width/2 + 5, height/2 + 5, 0, 0, 2 * Math.PI);
              ctx.stroke();
              break;
              
            case 'write':
              // Write comment text above the bounding box
              ctx.fillText(annotation.comment, x0, y0 - 10);
              break;
              
            case 'tick':
              // Draw a checkmark
              ctx.beginPath();
              ctx.moveTo(x0 - 10, y0 + height/2);
              ctx.lineTo(centerX, y1 + 10);
              ctx.lineTo(x1 + 10, y0 - 5);
              ctx.stroke();
              break;
              
            case 'cross':
              // Draw an X
              ctx.beginPath();
              ctx.moveTo(x0 - 5, y0 - 5);
              ctx.lineTo(x1 + 5, y1 + 5);
              ctx.moveTo(x1 + 5, y0 - 5);
              ctx.lineTo(x0 - 5, y1 + 5);
              ctx.stroke();
              break;
              
            case 'underline':
              // Draw underline
              ctx.beginPath();
              ctx.moveTo(x0, y1 + 5);
              ctx.lineTo(x1, y1 + 5);
              ctx.stroke();
              break;
          }
        });
        
        // Convert canvas to data URL
        const markedImageDataUrl = canvas.toDataURL('image/png');
        console.log('Image annotation completed');
        resolve(markedImageDataUrl);
      };
      
      img.onerror = () => {
        console.error('Failed to load image for annotation');
        resolve(null);
      };
      
      // Set source to trigger loading
      img.src = originalImage;
    });

  } catch (error) {
    console.error('Error applying markings to image:', error);
    return null;
  }
}
