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
  
  CRITICAL OUTPUT RULES:
  - Return ONLY raw JSON, no markdown formatting, no code blocks, no explanations
  - Output MUST strictly follow the format shown below
  
  ==================== EXAMPLE OUTPUT ====================
  
  Math Homework Example:
  {
    "annotations": [
      {"action": "tick", "bbox": [50, 80, 200, 150]},
      {"action": "comment", "bbox": [50, 180, 200, 50], "text": "Correct solution"},
    ]
  }
  
  Non-Math Example:
  {
    "annotations": [
      {"action": "write", "bbox": [50, 50, 400, 100], "comment": "This is a computer screenshot. Please upload a photo of math homework instead."}
    ]
  }
  
  ========================================================
  
  AVAILABLE ACTIONS: write, tick, cross, underline, comment
  
  IMPORTANT FORMAT & PLACEMENT RULES:
  1. Marking actions (tick, cross, underline):
     - Include ONLY {action, bbox}
     - Size must match the content being marked (no oversized marks)
     - Marking action should place at the exact positon you are marking (marking may overlap with the original text)
     - Comments may be place in conjunction with marking actions, but MUST FOLLOW the rules below
  
  2. Comment actions:
     - Must use {"action": "comment", "bbox": [...], "text": "..."}
     - Comments must appear in **blank space between lines of work**
     - DO NOT place comments adjacent to or overlapping student text
     
  
  3. Write actions:
     - May include {"action": "write", "bbox": [...], "comment": "..."}
     - Used for overall feedback
  
  4. IMAGE BOUNDARY CONSTRAINTS:
     - Every annotation bbox must satisfy:
       - x >= 0, y >= 0
       - (x + width) <= IMAGE_WIDTH
       - (y + height) <= IMAGE_HEIGHT
     - If placement would exceed boundary, shrink or reposition the bbox BEFORE returning
  
  5. COMMENT SPACING RULES:
     - Leave at least 20px padding between comments and existing text bboxes
     - Leave at least 20px padding between two comment bboxes
     - If no safe space is available inside the image, place the comment at the bottom inside the image with reduced height
     - Insert line breaks when comments is too long

  6. FINAL CHECK BEFORE OUTPUT:
     - Ensure no bbox exceeds the image boundary
     - Ensure no bbox overlaps OCR-detected text
     - Ensure comments are clearly readable in blank areas only
     - If uncertain, place comments lower in the image (stacked at bottom), not at edges
  
  Bounding box format: [x, y, width, height]  
  where (x, y) is top-left corner.
  
  Return ONLY the JSON object.`;
  

  let userPrompt = `Here is an uploaded image. Please:

1. Analyze the image content
2. If it's math homework, provide marking annotations
3. If it's not math homework, provide appropriate feedback

========================================================
`;

  // Add bounding box information to the prompt
  if (processedImage && processedImage.boundingBoxes && processedImage.boundingBoxes.length > 0) {
    userPrompt += `\n\nHere is the OCR DETECTION RESULTS for the uploaded image (Only LaTex content are shown) - Use these bounding box positions as reference for annotations:`;
    
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

        if (bbox.x !== undefined && bbox.y !== undefined && bbox.width !== undefined && bbox.height !== undefined) {
          userPrompt += `bbox[${bbox.x},${bbox.y},${bbox.width},${bbox.height}], text: "${cleanText}", confidence: "${confidence}%"\n`;
        } else {
          userPrompt += `text: "${cleanText}", confidence: "${confidence}%"\n`;
        }
      }
    });
    
    userPrompt += `\nUse OCR positions as a guide to avoid overlaps and to find blank spaces for comments.`;
    userPrompt += `\n\nIMAGE DIMENSIONS: ${processedImage.imageDimensions.width}x${processedImage.imageDimensions.height} pixels`;
    userPrompt += `\nIMPORTANT: All annotations must stay within these dimensions.`;
    userPrompt += `\n(x + width) <= ${processedImage.imageDimensions.width}`;
    userPrompt += `\n(y + height) <= ${processedImage.imageDimensions.height}`;
    userPrompt += `\nIf diagrams, graphs, or math symbols are not detected by OCR, estimate their positions and annotate accordingly.`;
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

  console.log('🔍 Raw AI Response:', content.substring(0, 500) + '...');
  
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    const extractedJson = jsonMatch[1];
    console.log('🔍 Extracted JSON from markdown:', extractedJson.substring(0, 300) + '...');
    try {
      return JSON.parse(extractedJson);
    } catch (parseError) {
      console.error('🔍 JSON Parse Error (extracted):', parseError);
      console.error('🔍 Problematic JSON:', extractedJson);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse AI response JSON: ${errorMessage}`);
    }
  }
  
  console.log('🔍 Attempting to parse raw content as JSON...');
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('🔍 JSON Parse Error (raw):', parseError);
    console.error('🔍 Problematic content:', content.substring(0, 500));
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Failed to parse AI response JSON: ${errorMessage}`);
  }
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

  console.log('🔍 Raw Gemini Response:', content.substring(0, 500) + '...');
  
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    const extractedJson = jsonMatch[1];
    console.log('🔍 Extracted JSON from markdown:', extractedJson.substring(0, 300) + '...');
    try {
      return JSON.parse(extractedJson);
    } catch (parseError) {
      console.error('🔍 JSON Parse Error (extracted):', parseError);
      console.error('🔍 Problematic JSON:', extractedJson);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse Gemini response JSON: ${errorMessage}`);
    }
  }
  
  console.log('🔍 Attempting to parse raw content as JSON...');
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('🔍 JSON Parse Error (raw):', parseError);
    console.error('🔍 Problematic content:', content.substring(0, 500));
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Failed to parse Gemini response JSON: ${errorMessage}`);
  }
}

async function applyMarkingsToImage(originalImage: string, instructions: MarkingInstructions): Promise<string> {
  const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  const testSharp = sharp(imageBuffer);
  let markedImage = sharp(imageBuffer);
  
  const imageMetadata = await markedImage.metadata();
  try {
    let svgOverlay = createSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
    
    if (!svgOverlay) {
      console.log('🔍 Complex SVG failed, trying simple fallback...');
      svgOverlay = createSimpleSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
    }
    
    if (svgOverlay) {
      console.log('🔍 Attempting to composite SVG overlay...');
      try {
        const svgBuffer = Buffer.from(svgOverlay);
        console.log('🔍 SVG buffer size:', svgBuffer.length);
        
        markedImage = markedImage.composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0
          }
        ]);
        console.log('🔍 SVG composite successful');
      } catch (compositeError) {
        console.error('🔍 SVG composite failed:', compositeError);
        console.log('🔍 Continuing without SVG overlay...');
      }
    } else {
      console.log('🔍 No SVG overlay to composite');
    }
  } catch (svgError) {
    console.error('🔍 SVG overlay creation failed:', svgError);
    // Try simple fallback
    try {
      const simpleSvg = createSimpleSVGOverlay(instructions, imageMetadata.width || 400, imageMetadata.height || 300);
      if (simpleSvg) {
        console.log('🔍 Trying simple SVG fallback...');
        markedImage = markedImage.composite([
          {
            input: Buffer.from(simpleSvg),
            top: 0,
            left: 0
          }
        ]);
        console.log('🔍 Simple SVG composite successful');
      }
    } catch (fallbackError) {
      console.error('🔍 Simple SVG fallback also failed:', fallbackError);
      console.log('🔍 Continuing without SVG overlay...');
    }
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
        let cleanComment = annotation.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        
        // Handle LaTeX expressions by converting them to plain text
        cleanComment = cleanComment
          .replace(/\\\(/g, '(') // Convert \( to (
          .replace(/\\\)/g, ')') // Convert \) to )
          .replace(/\\\\/g, '\\') // Convert \\ to \
          .replace(/\\mathrm\{([^}]*)\}/g, '$1') // Convert \mathrm{text} to text
          .replace(/\\approx/g, '≈') // Convert \approx to ≈
          .replace(/\\mathrm/g, '') // Remove \mathrm
          .replace(/\\text\{([^}]*)\}/g, '$1') // Convert \text{text} to text
          .replace(/\\mathrm\{([^}]*)\}/g, '$1'); // Convert \mathrm{text} to text
        
        // Split text by line breaks and handle each line separately
        const lines = cleanComment.split('\n');
        
        // Calculate font size based on bounding box size
        const baseFontSize = Math.max(24, Math.min(width, height) / 8);
        const scaledFontSize = Math.min(baseFontSize, 80); // Cap at 80px to avoid oversized text
        
        // Calculate dynamic line height based on font size
        const lineHeight = scaledFontSize * 1.2; // 1.2x font size for line height
        
        // Position comment text to the right of the annotation area
        const commentX = x ; // 10px to the right of the bounding box
        const startY = y - ((lines.length - 1) * lineHeight / 2); // Center the multi-line text
        
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
            svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Lucida Handwriting, cursive, sans-serif" font-size="${scaledFontSize}" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
          }
        });
      }
      return; // Skip visual annotation for comment actions
    }
    
    // Handle legacy comment field for backward compatibility (write actions)
    if (annotation.comment && annotation.comment.trim()) {
      // Clean and escape the comment text for SVG
      let cleanComment = annotation.comment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      // Handle LaTeX expressions by converting them to plain text
      cleanComment = cleanComment
        .replace(/\\\(/g, '(') // Convert \( to (
        .replace(/\\\)/g, ')') // Convert \) to )
        .replace(/\\\\/g, '\\') // Convert \\ to \
        .replace(/\\mathrm\{([^}]*)\}/g, '$1') // Convert \mathrm{text} to text
        .replace(/\\approx/g, '≈') // Convert \approx to ≈
        .replace(/\\mathrm/g, '') // Remove \mathrm
        .replace(/\\text\{([^}]*)\}/g, '$1') // Convert \text{text} to text
        .replace(/\\mathrm\{([^}]*)\}/g, '$1'); // Convert \mathrm{text} to text
      
      // Split text by line breaks and handle each line separately
      const lines = cleanComment.split('\n');
      
      // Calculate font size based on bounding box size
      const baseFontSize = Math.max(24, Math.min(width, height) / 8);
      const scaledFontSize = Math.min(baseFontSize, 80); // Cap at 80px to avoid oversized text
      
      // Calculate dynamic line height based on font size
      const lineHeight = scaledFontSize * 1.2; // 1.2x font size for line height
      
      // Position comment text to the right of the annotation area
      const commentX = x ; // 10px to the right of the bounding box
      const startY = y - ((lines.length - 1) * lineHeight / 2); // Center the multi-line text
      
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
          svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Lucida Handwriting, cursive, sans-serif" font-size="${scaledFontSize}" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
        }
      });
    }
    
    // Add the visual annotation based on type
    switch (annotation.action) {
      case 'tick':
        // Calculate font size based on bounding box size for tick
        const tickFontSize = Math.max(40, Math.min(width, height) / 2);
        const scaledTickSize = Math.min(tickFontSize, 200); // Cap at 200px
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Arial, sans-serif" font-size="${scaledTickSize}" font-weight="bold" text-anchor="middle">✔</text>`;
        break;
      case 'cross':
        // Calculate font size based on bounding box size for cross
        const crossFontSize = Math.max(40, Math.min(width, height) / 2);
        const scaledCrossSize = Math.min(crossFontSize, 250); // Cap at 250px
        svg += `<text x="${centerX}" y="${centerY + 5}" fill="red" font-family="Arial, sans-serif" font-size="${scaledCrossSize}" font-weight="bold" text-anchor="middle">✘</text>`;
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
  
  // Additional validation
  if (svg.length < 100) {
    console.error('🔍 SVG too short, likely invalid');
    return null;
  }
  
  // Check for basic SVG structure
  if (!svg.includes('<svg') || !svg.includes('</svg>') || !svg.includes('xmlns=')) {
    console.error('🔍 Invalid SVG structure');
    return null;
  }
  
  // Validate SVG structure
  if (!svg.includes('<svg') || !svg.includes('</svg>')) {
    console.error('🔍 Invalid SVG structure detected');
    return null;
  }
  
  // Check for common XML issues - more sophisticated ampersand detection
  const ampersandRegex = /&(?!amp;|lt;|gt;|quot;|#39;|#x[0-9a-fA-F]+;)/g;
  if (ampersandRegex.test(svg)) {
    console.error('🔍 Unescaped ampersands detected in SVG');
    // Try to fix unescaped ampersands
    svg = svg.replace(/&(?!amp;|lt;|gt;|quot;|#39;|#x[0-9a-fA-F]+;)/g, '&amp;');
    console.log('🔍 Fixed unescaped ampersands in SVG');
  }
  
  return svg;
}

// Fallback function to create a simple SVG overlay
function createSimpleSVGOverlay(instructions: MarkingInstructions, imageWidth: number = 400, imageHeight: number = 300): string | null {
  if (!instructions.annotations || instructions.annotations.length === 0) {
    return null;
  }

  console.log('🔍 Creating simple SVG overlay as fallback...');
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">`;
  
  instructions.annotations.forEach((annotation, index) => {
    const [x, y, width, height] = annotation.bbox;
    const centerX = x + (width / 2);
    const centerY = y + (height / 2);
    
    // Handle comments first
    if (annotation.action === 'comment' && annotation.text && annotation.text.trim()) {
      const cleanComment = annotation.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .replace(/\\mathrm\{([^}]*)\}/g, '$1')
        .replace(/\\approx/g, '≈')
        .replace(/\\mathrm/g, '')
        .replace(/\\text\{([^}]*)\}/g, '$1');
      
      const lines = cleanComment.split('\n');
      const commentX = x + width + 10;
      const startY = y + (height / 2) - ((lines.length - 1) * 30 / 2);
      
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          const lineY = startY + (lineIndex * 30);
          svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Lucida Handwriting, cursive, sans-serif" font-size="24" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
        }
      });
      return;
    }
    
    // Handle legacy comment field for write actions
    if (annotation.comment && annotation.comment.trim()) {
      const cleanComment = annotation.comment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .replace(/\\mathrm\{([^}]*)\}/g, '$1')
        .replace(/\\approx/g, '≈')
        .replace(/\\mathrm/g, '')
        .replace(/\\text\{([^}]*)\}/g, '$1');
      
      const lines = cleanComment.split('\n');
      const commentX = x + width + 10;
      const startY = y + (height / 2) - ((lines.length - 1) * 30 / 2);
      
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          const lineY = startY + (lineIndex * 30);
          svg += `<text x="${commentX}" y="${lineY}" fill="red" font-family="Lucida Handwriting, cursive, sans-serif" font-size="24" font-weight="bold" text-anchor="start" dominant-baseline="middle">${line}</text>`;
        }
      });
    }
    
    // Add visual marks
    switch (annotation.action) {
      case 'tick':
        svg += `<text x="${centerX}" y="${centerY}" fill="red" font-family="Arial" font-size="40" text-anchor="middle">✓</text>`;
        break;
      case 'cross':
        svg += `<text x="${centerX}" y="${centerY}" fill="red" font-family="Arial" font-size="40" text-anchor="middle">✗</text>`;
        break;
      case 'circle':
        const radius = Math.max(width, height) / 2 + 5;
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="red" stroke-width="3"/>`;
        break;
      case 'underline':
        svg += `<line x1="${x}" y1="${y + height + 5}" x2="${x + width}" y2="${y + height + 5}" stroke="red" stroke-width="3"/>`;
        break;
    }
  });
  
  svg += '</svg>';
  console.log('🔍 Simple SVG overlay created, length:', svg.length);
  
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
