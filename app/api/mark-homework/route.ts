import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageProcessingService } from '@/services/imageProcessingService';

interface Annotation {
  action: 'circle' | 'write' | 'tick' | 'cross' | 'underline';
  bbox: [number, number, number, number];
  comment: string;
}

interface MarkingInstructions {
  annotations: Annotation[];
}

export async function POST(req: NextRequest) {
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

  const processedImage = await ImageProcessingService.processImage(imageData);
  console.log('🔍 ImageProcessingService completed successfully!');
  console.log('🔍 OCR Text length:', processedImage.ocrText.length);
  console.log('🔍 Bounding boxes found:', processedImage.boundingBoxes.length);
  
  const markingInstructions = await generateMarkingInstructions(imageData, model, processedImage);
  const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
  
  const modelName = model === 'gemini-2.5-pro' ? 'Google Gemini 2.5 Pro' : 
                   model === 'chatgpt-5' ? 'OpenAI ChatGPT 5' : 'OpenAI GPT-4 Omni';
  
  let apiUsed = '';
  if (model === 'gemini-2.5-pro') {
    apiUsed = 'Google Gemini 2.0 Flash Exp';
  } else if (model === 'chatgpt-5') {
    apiUsed = 'OpenAI GPT-5';
  } else {
    apiUsed = 'OpenAI GPT-4 Omni';
  }
  
  return NextResponse.json({ 
    markedImage,
    instructions: markingInstructions,
    message: `Homework marked successfully using ${modelName} + Sharp image processing`,
    apiUsed,
    ocrMethod: processedImage.ocrText && processedImage.ocrText.length > 0 && 
               processedImage.boundingBoxes && processedImage.boundingBoxes.length > 0 ? 
               'Mathpix API' : 'Tesseract.js (Fallback)'
  });
}

async function generateMarkingInstructions(imageData: string, model?: string, processedImage?: any): Promise<MarkingInstructions> {
  const compressedImage = await compressImage(imageData);
  const imageUrl = compressedImage;

  const systemPrompt = `You are an AI assistant analyzing ocr of images. 
You will receive ocr description of an image and your task is to:

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
bounding box coordinates are in the format [x,y,width,height] where x and y are the top left corner of the bounding box and width and height are the width and height of the bounding box.
IMPORTANT: Do NOT use markdown code blocks. Return ONLY the raw JSON object.`;

  let userPrompt = `Here is ocr description of the image. Please:

1. Analyze the image content
2. If it's math homework, provide marking annotations
3. If it's not math homework, provide appropriate feedback

The ocr description of the question are also provided, feel free to ignore it if it's not relevant to marking.
Focus on providing clear, actionable annotations with bounding boxes and comments.`;

  if (processedImage && processedImage.boundingBoxes && processedImage.boundingBoxes.length > 0) {
    userPrompt += `\n\nOCR DETECTION RESULTS - Use these bounding box positions as reference for annotations:\n`;
    userPrompt += `The following text regions were detected in the image:\n`;
    
    processedImage.boundingBoxes.forEach((bbox: any, index: number) => {
      if (bbox.text && bbox.text.trim()) {
        const confidence = ((bbox.confidence || 0) * 100).toFixed(1);
        
                 // The MathpixService has already converted cnt coordinates to x,y,width,height format
         // and scaled them to match the original image dimensions
         if (bbox.x !== undefined && bbox.y !== undefined && bbox.width !== undefined && bbox.height !== undefined) {
          userPrompt += `bbox[${bbox.x},${bbox.y},${bbox.width},${bbox.height}], text: "${bbox.text.trim()}", confidence: "${confidence}%"\n`;
        } else {
          userPrompt += `text: "${bbox.text.trim()}", confidence: "${confidence}%"\n`;
        }
      }
    });
    
    userPrompt += `\nIMPORTANT: Use these exact bounding box coordinates [x,y,width,height] when creating your annotations.`;
    userPrompt += `\nThe OCR has already identified the positions of text and mathematical symbols in the image.`;
    userPrompt += `\nReference these positions to place your annotations accurately.`;
  }
  
  console.log(systemPrompt+userPrompt)
  
  if (model === 'gemini-2.5-pro') {
    return await callGeminiForMarking(imageUrl, systemPrompt, userPrompt);
  } else if (model === 'chatgpt-5') {
    return await callOpenAIForMarking(systemPrompt, userPrompt, 'gpt-5');
  } else {
    return await callOpenAIForMarking(systemPrompt, userPrompt, 'gpt-4o');
  }
}

async function callOpenAIForMarking(systemPrompt: string, userPrompt: string, openaiModel: string = 'gpt-4o'): Promise<MarkingInstructions> {
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
    model: openaiModel,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
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
    throw new Error('OpenAI API returned no content');
  }

  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    const extractedJson = jsonMatch[1];
    return JSON.parse(extractedJson);
  }
  
  return JSON.parse(content);
}

async function callGeminiForMarking(imageUrl: string, systemPrompt: string, userPrompt: string): Promise<MarkingInstructions> {
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
              data: imageUrl.replace('data:image/jpeg;base64,', '')
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
    throw new Error('Gemini API returned no content');
  }

  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    const extractedJson = jsonMatch[1];
    return JSON.parse(extractedJson);
  }
  
  return JSON.parse(content);
}

async function applyMarkingsToImage(originalImage: string, instructions: MarkingInstructions): Promise<string> {
  const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  const testSharp = sharp(imageBuffer);
  let markedImage = sharp(imageBuffer);
  
  const imageMetadata = await markedImage.metadata();
  const svgOverlay = createSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
  
  if (svgOverlay) {
    markedImage = markedImage.composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }
    ]);
  }
  
  const outputBuffer = await markedImage.png().toBuffer();
  const base64Output = `data:image/png;base64,${outputBuffer.toString('base64')}`;
  
  return base64Output;
}

function createSVGOverlay(instructions: MarkingInstructions, imageWidth: number = 400, imageHeight: number = 300): string | null {
  if (!instructions.annotations || instructions.annotations.length === 0) {
    return null;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" style="position: absolute; top: 0; left: 0;">`;
  
  instructions.annotations.forEach((annotation, index) => {
    const [x0, y0, x1, y1] = annotation.bbox;
    const centerX = (x0 + x1) / 2;
    const centerY = (y0 + y1) / 2;
    const width = x1 - x0;
    const height = y1 - y0;
    
    switch (annotation.action) {
      case 'tick':
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Arial" font-size="100" font-weight="bold" text-anchor="middle">✔</text>`;
        break;
      case 'cross':
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Arial" font-size="100" font-weight="bold" text-anchor="middle">✘</text>`;
        break;
      case 'write':
      case 'circle':
      case 'underline':
      default:
        svg += `<text x="${x0}" y="${y0}" fill="red" font-family="Comic Sans MS, cursive" font-size="48" font-weight="bold" text-anchor="start" dominant-baseline="hanging">${annotation.comment}</text>`;
        break;
    }
  });
  
  svg += '</svg>';
  return svg;
}

async function compressImage(imageData: string): Promise<string> {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data format');
  }

  if (!imageData.startsWith('data:image/')) {
    throw new Error('Invalid image data URL format');
  }

  const match = imageData.match(/^data:image\/([a-z]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Failed to parse image data URL');
  }

  const [, format, base64Data] = match;
  
  if (!base64Data || base64Data === 'test') {
    throw new Error('Invalid base64 image data');
  }

  if (base64Data.length < 50) {
    throw new Error('Image data too small');
  }

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    throw new Error('Invalid base64 format');
  }

  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  if (imageBuffer.length === 0) {
    throw new Error('Failed to create image buffer');
  }

  if (imageBuffer.length < 100) {
    return imageData;
  }

  const compressedBuffer = await sharp(imageBuffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  
  const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  
  return compressedBase64;
}
