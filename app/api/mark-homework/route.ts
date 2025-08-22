import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageData, imageName }: { imageData: string; imageName: string } = await req.json();
    
    if (!imageData || !imageName) {
      return NextResponse.json({ error: 'Missing image data or name' }, { status: 400 });
    }

    // Stage 1: GPT-4 Analysis - Generate marking instructions
    let markingInstructions;
    try {
      markingInstructions = await generateMarkingInstructions(imageData);
    } catch (error) {
      console.error('Error in Stage 1:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to generate marking instructions' 
      }, { status: 500 });
    }
    
    if (!markingInstructions) {
      return NextResponse.json({ error: 'Failed to generate marking instructions - no response from AI' }, { status: 500 });
    }

    // Stage 2: Image Editing - Apply markings to the image
    const markedImage = await applyMarkingsToImage(imageData, markingInstructions);
    
    if (!markedImage) {
      return NextResponse.json({ error: 'Failed to apply markings to image' }, { status: 500 });
    }

    return NextResponse.json({ 
      markedImage,
      instructions: markingInstructions,
      message: 'Homework marked successfully'
    });

  } catch (error) {
    console.error('Marking API error:', error);
    return NextResponse.json({ error: 'Failed to process homework marking' }, { status: 500 });
  }
}

async function generateMarkingInstructions(imageData: string): Promise<any> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
      return null;
    }
    
    const systemPrompt = `You are an AI teacher that marks student homework. 
You will be given an image of a student's handwritten work. 
Your task is to produce structured instructions for how to annotate the image.

- Do not return explanations for humans. 
- Instead, return JSON that describes:
  1. Mistakes (with location if possible).
  2. Corrections to write in red.
  3. Short teacher comments to add in red pen.
  4. General placement hints (e.g., "next to step 3", "circle final answer", "top right margin").

Example Output:
{
  "annotations": [
    {"action": "circle", "target": "final answer 20", "comment": "Should be 25"},
    {"action": "write", "target": "next to step 2", "comment": "Check your multiplication"},
    {"action": "tick", "target": "step 1"}
  ]
}

Return ONLY the JSON object, no other text.`;

    const userPrompt = `Here is a student's homework. Provide annotation instructions in JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o as GPT-5 is not yet available
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
        temperature: 0.1, // Low temperature for consistent JSON output
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Return more specific error information
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
      return null;
    }

  } catch (error) {
    console.error('Error generating marking instructions:', error);
    return null;
  }
}

async function applyMarkingsToImage(originalImage: string, instructions: any): Promise<string | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('No OpenAI API key provided');
      return null;
    }
    
    // Create a detailed prompt for the image editing model
    const editingPrompt = createEditingPrompt(instructions);
    
    // For now, we'll use DALL-E 3 to generate a new image with markings
    // In a production system, you might want to use a more specialized image editing model
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: editingPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DALL-E API error:', errorData);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    return imageUrl || null;

  } catch (error) {
    console.error('Error applying markings to image:', error);
    return null;
  }
}

function createEditingPrompt(instructions: any): string {
  let prompt = `Take the input student homework image and mark it as a teacher would.

- Use red pen style handwriting.
- Follow these annotations exactly:`;

  if (instructions.annotations && Array.isArray(instructions.annotations)) {
    instructions.annotations.forEach((annotation: any, index: number) => {
      const { action, target, comment } = annotation;
      
      switch (action) {
        case 'circle':
          prompt += `\n${index + 1}. Circle the student's ${target} and write "${comment}" in red.`;
          break;
        case 'write':
          prompt += `\n${index + 1}. ${target}, write "${comment}" in red ink.`;
          break;
        case 'tick':
          prompt += `\n${index + 1}. Place a red tick next to ${target}.`;
          break;
        case 'cross':
          prompt += `\n${index + 1}. Put a red cross through ${target}.`;
          break;
        case 'underline':
          prompt += `\n${index + 1}. Underline ${target} in red.`;
          break;
        default:
          prompt += `\n${index + 1}. ${action} ${target} with "${comment}" in red.`;
      }
    });
  }

  prompt += `

Do not change the student's original writing. 
Only overlay corrections in red ink, as if written by a teacher on paper.
Make the red markings clearly visible and professional-looking.`;

  return prompt;
}
