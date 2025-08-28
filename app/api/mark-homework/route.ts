import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageProcessingService } from '@/services/imageProcessingService';

interface Annotation {
  action: 'circle' | 'write' | 'tick' | 'cross' | 'underline' | 'comment';
  bbox: [number, number, number, number];
  comment?: string; // Optional for marking actions
  text?: string; // For comment actions
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

  const systemPrompt = `You are an AI assistant analyzing images. 
You will receive an image and your task is to:

1. Analyze the image content
2. Provide marking annotations if it's math homework, or general feedback if not

CRITICAL: Return ONLY raw JSON, no markdown formatting, no code blocks, no explanations.

Output JSON only with this exact format:

Example Output for Math Homework (return exactly this format, no markdown):
{
  "annotations": [
    {"action": "tick", "bbox": [50, 80, 200, 150]},
    {"action": "comment", "bbox": [50, 80, 200, 150], "text": "Correct solution"},
    {"action": "cross", "bbox": [100, 200, 150, 100]},
    {"action": "comment", "bbox": [100, 200, 150, 100], "text": "Check your calculation here"},
    {"action": "write", "bbox": [50, 160, 200, 180], "comment": "Good work!"}
  ]
}

Example Output for Non-Math Content (return exactly this format, no markdown):
{
  "annotations": [
    {"action": "write", "bbox": [50, 50, 400, 100], "comment": "This is a computer screenshot. Please upload a photo of math homework instead."}
  ]
}

Available actions: circle, write, tick, cross, underline, comment

IMPORTANT FORMAT RULES:
- Marking actions (tick, cross, circle, underline) should ONLY include the action and bbox - NO comments
- Comments should be separate entries with action: "comment" and use "text" field for the comment content
- The comment should inculde line-break as nessasary to make it more readable.
- The size of the tick, cross, circle, underline should be relative to the size of the part they are marking (No oversize action).
- Each marking action can have a corresponding comment entry with the same bbox coordinates
- The "write" action can still include a comment field for immediate text display

bounding box coordinates are in the format [x,y,width,height] where x and y are the top left corner of the bounding box and width and height are the width and height of the bounding box for the action.
IMPORTANT: Do NOT use markdown code blocks. Return ONLY the raw JSON object.`;

  let userPrompt = `Here is an uploaded image. Please:

1. Analyze the image content
2. If it's math homework, provide marking annotations
3. If it's not math homework, provide appropriate feedback

Focus on providing clear, actionable annotations with bounding boxes and comments.

IMPORTANT: Separate marking actions from comments:
- Use tick, cross, circle, underline actions for visual marks ONLY
- Create separate comment entries for explanations using action: "comment" and text field
- This allows for cleaner visual presentation and better organization`;

  if (processedImage && processedImage.boundingBoxes && processedImage.boundingBoxes.length > 0) {
    userPrompt += `\n\nOCR DETECTION RESULTS - Use these bounding box positions as reference for annotations:\n`;
    userPrompt += `The following text regions were detected in the image:\n`;
    
         processedImage.boundingBoxes.forEach((bbox: any, index: number) => {
       if (bbox.text && bbox.text.trim()) {
         const confidence = ((bbox.confidence || 0) * 100).toFixed(1);
         
         // Clean and escape the text to prevent JSON parsing issues
         const cleanText = bbox.text.trim()
           .replace(/\\/g, '\\\\')
           .replace(/"/g, '\\"')
           .replace(/\n/g, '\\n')
           .replace(/\r/g, '\\r')
           .replace(/\t/g, '\\t');
         
         // The MathpixService has already converted cnt coordinates to x,y,width,height format
         // and scaled them to match the original image dimensions
         if (bbox.x !== undefined && bbox.y !== undefined && bbox.width !== undefined && bbox.height !== undefined) {
           userPrompt += `bbox[${bbox.x},${bbox.y},${bbox.width},${bbox.height}], text: "${cleanText}", confidence: "${confidence}%"\n`;
         } else {
           userPrompt += `text: "${cleanText}", confidence: "${confidence}%"\n`;
         }
       }
     });
    
    userPrompt += `\n\nIMAGE DIMENSIONS: ${processedImage.imageDimensions.width}x${processedImage.imageDimensions.height} pixels`;
    userPrompt += `\nNo annotation/comments should cross the boundary of the image. Check yourself by adding coordinate and width/height of each annotation/comment, and making sure it is within the image boundaries.`;
    userPrompt += `\n\nIMPORTANT: Use these exact bounding box coordinates [x,y,width,height] when creating your annotations.`;
    userPrompt += `\nThe OCR has already identified the positions of text and mathematical symbols in the image.`;
    userPrompt += `\nReference and extrapolate these positions to place your annotations accurately.`;
    userPrompt += `\nComments should write in blank space, not in the same line as the student's work. Use the OCR results to avoid this`;
    userPrompt += `\nThe image may also incude diagrams, graphs, dense mathematical notation, vectors/matrix, or other non-text content that ocr fail to detect.`;
    userPrompt += `\nPlease feel free to fill in the gaps and annotate those as you see fit.`;
  }
  
  console.log(systemPrompt+userPrompt)
  
  if (model === 'gemini-2.5-pro') {
    return await callGeminiForMarking(imageUrl, systemPrompt, userPrompt);
  } else if (model === 'chatgpt-5') {
    return await callOpenAIForMarking(imageUrl, systemPrompt, userPrompt, 'gpt-5');
  } else {
    return await callOpenAIForMarking(imageUrl, systemPrompt, userPrompt, 'gpt-4o');
  }
}

async function callOpenAIForMarking(imageUrl: string, systemPrompt: string, userPrompt: string, openaiModel: string = 'gpt-4o'): Promise<MarkingInstructions> {
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
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
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

  console.log('🔍 Creating SVG overlay with annotations:', instructions.annotations.length);
  instructions.annotations.forEach((annotation, index) => {
    console.log(`🔍 Annotation ${index + 1}:`, {
      action: annotation.action,
      comment: annotation.comment,
      text: annotation.text,
      bbox: annotation.bbox,
      hasComment: !!(annotation.comment || annotation.text),
      commentLength: (annotation.comment ? annotation.comment.length : 0) + (annotation.text ? annotation.text.length : 0)
    });
  });

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" style="position: absolute; top: 0; left: 0;">`;
  
  instructions.annotations.forEach((annotation, index) => {
    // Bounding box format: [x, y, width, height]
    const [x, y, width, height] = annotation.bbox;
    const centerX = x + (width / 2);
    const centerY = y + (height / 2);
    
    // Handle comment actions separately
    if (annotation.action === 'comment') {
      if (annotation.text && annotation.text.trim()) {
        // Clean and escape the comment text for SVG
        const cleanComment = annotation.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        
        // Split text by line breaks and handle each line separately
        const lines = cleanComment.split('\n');
        
        // Calculate font size based on bounding box size
        const baseFontSize = Math.max(24, Math.min(width, height) / 8);
        const scaledFontSize = Math.min(baseFontSize, 80); // Cap at 80px to avoid oversized text
        
        // Calculate dynamic line height based on font size
        const lineHeight = scaledFontSize * 1.2; // 1.2x font size for line height
        
        // Position comment text to the right of the annotation area
        const commentX = x + width + 10; // 10px to the right of the bounding box
        const startY = y + (height / 2) - ((lines.length - 1) * lineHeight / 2); // Center the multi-line text
        
        console.log(`🔍 Adding comment text for annotation ${index + 1}:`, {
          original: annotation.text,
          cleaned: cleanComment,
          lines: lines.length,
          position: { x: commentX, y: startY }
        });
        
        // Add each line as a separate text element
        lines.forEach((line, lineIndex) => {
          if (line.trim()) { // Only add non-empty lines
            const lineY = startY + (lineIndex * lineHeight);
            svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Segoe Script, cursive" font-size="${scaledFontSize}" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
          }
        });
      }
      return; // Skip visual annotation for comment actions
    }
    
    // Handle legacy comment field for backward compatibility (write actions)
    if (annotation.comment && annotation.comment.trim()) {
      // Clean and escape the comment text for SVG
      const cleanComment = annotation.comment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      // Split text by line breaks and handle each line separately
      const lines = cleanComment.split('\n');
      
      // Calculate font size based on bounding box size
      const baseFontSize = Math.max(24, Math.min(width, height) / 8);
      const scaledFontSize = Math.min(baseFontSize, 80); // Cap at 80px to avoid oversized text
      
      // Calculate dynamic line height based on font size
      const lineHeight = scaledFontSize * 1.2; // 1.2x font size for line height
      
      // Position comment text to the right of the annotation area
      const commentX = x + width + 10; // 10px to the right of the bounding box
      const startY = y + (height / 2) - ((lines.length - 1) * lineHeight / 2); // Center the multi-line text
      
      console.log(`🔍 Adding legacy comment text for annotation ${index + 1}:`, {
        original: annotation.comment,
        cleaned: cleanComment,
        lines: lines.length,
        position: { x: commentX, y: startY }
      });
      
            // Add each line as a separate text element
      lines.forEach((line, lineIndex) => {
        if (line.trim()) { // Only add non-empty lines
          const lineY = startY + (lineIndex * lineHeight);
          svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Segoe Script, cursive" font-size="${scaledFontSize}" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
        }
      });
    }
    
    // Add the visual annotation based on type
    switch (annotation.action) {
      case 'tick':
        // Calculate font size based on bounding box size for tick
        const tickFontSize = Math.max(40, Math.min(width, height) / 2);
        const scaledTickSize = Math.min(tickFontSize, 200); // Cap at 200px
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Segoe Script, cursive" font-size="${scaledTickSize}" font-weight="bold" text-anchor="middle">✔</text>`;
        break;
      case 'cross':
        // Calculate font size based on bounding box size for cross
        const crossFontSize = Math.max(40, Math.min(width, height) / 2);
        const scaledCrossSize = Math.min(crossFontSize, 250); // Cap at 250px
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Segoe Script, cursive" font-size="${scaledCrossSize}" font-weight="bold" text-anchor="middle">✘</text>`;
        break;
      case 'circle':
        // Draw a red circle around the area with better positioning
        const radius = Math.max(width, height) / 2 + 5;
        const strokeWidth = Math.max(2, Math.min(width, height) / 20); // Scale stroke width
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="red" stroke-width="${strokeWidth}" opacity="0.8"/>`;
        console.log(`🔍 Added circle annotation ${index + 1}:`, {
          center: { x: centerX, y: centerY },
          radius: radius,
          bbox: { width, height },
          strokeWidth: strokeWidth
        });
        break;
      case 'underline':
        // Draw a red underline with scaled stroke width
        const underlineStrokeWidth = Math.max(2, Math.min(width, height) / 20); // Scale stroke width
        svg += `<line x1="${x}" y1="${y + height + 5}" x2="${x + width}" y2="${y + height + 5}" stroke="red" stroke-width="${underlineStrokeWidth}" opacity="0.8"/>`;
        break;
      case 'write':
      default:
        // For write actions, just show the comment text (already added above)
        break;
    }
  });
  
  svg += '</svg>';
  
  console.log('🔍 SVG overlay created successfully, length:', svg.length);
  console.log('🔍 SVG preview (first 500 chars):', svg.substring(0, 500));
  
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
