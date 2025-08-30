import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { message, imageData, imageName, model, isInitialQuestion } = requestBody;
    
    if (!imageData || !imageName) {
      return NextResponse.json({ error: 'Missing image data or name' }, { status: 400 });
    }

    let reply: string | null = null;
    let apiUsed = '';

    try {
      if (model === 'chatgpt-5' || model === 'chatgpt-4o') {
        try {
          reply = await callChatGPT(message, model, imageData, imageName, isInitialQuestion);
          apiUsed = model === 'chatgpt-5' ? 'OpenAI GPT-5' : 'OpenAI GPT-4 Omni';
        } catch (chatgptError) {
          console.log('ChatGPT failed, trying Gemini...');
          reply = await callGeminiWithImage(message, imageData, imageName, isInitialQuestion);
          apiUsed = 'Google Gemini 2.0 Flash Exp';
        }
      } else {
        // Default to Gemini
        try {
          reply = await callGeminiWithImage(message, imageData, imageName, isInitialQuestion);
          apiUsed = 'Google Gemini 2.0 Flash Exp';
        } catch (geminiError) {
          console.log('Gemini failed, trying ChatGPT...');
          reply = await callChatGPT(message, 'chatgpt-4o', imageData, imageName, isInitialQuestion);
          apiUsed = 'OpenAI GPT-4 Omni';
        }
      }
    } catch (error) {
      console.error('All AI services failed:', error);
      reply = `I'm having trouble analyzing the image right now. Could you please describe the math question you're working on, and I'll be happy to help you solve it step by step!`;
      apiUsed = 'Fallback Response';
    }

    return NextResponse.json({ 
      reply,
      apiUsed,
      model: model || 'gemini-2.5-pro'
    });

  } catch (error) {
    console.error('Mark homework chat API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function callChatGPT(message: string, model: string, imageData: string, imageName: string, isInitialQuestion: boolean): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = isInitialQuestion 
    ? `You are a helpful GCSE Maths tutor. When a student uploads a math question image, provide a clear, step-by-step explanation of how to solve it. Be encouraging and explain each step thoroughly. Use LaTeX for mathematical expressions when appropriate.`
    : `You are a helpful GCSE Maths tutor. Continue helping the student with their math question. Provide clear explanations, step-by-step solutions, and encouragement. Use LaTeX for mathematical expressions when appropriate.`;

  const userPrompt = isInitialQuestion 
    ? `I've uploaded a photo of a math question. Please analyze the image and provide a step-by-step explanation of how to solve this problem.`
    : message || 'Please continue helping me with this math question.';

  const requestBody = {
    model: model === 'chatgpt-5' ? 'gpt-5' : 'gpt-4o',
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
              url: imageData,
            },
          },
        ],
      },
    ],
    ...(model === 'chatgpt-5' ? { max_completion_tokens: 2000 } : { max_tokens: 2000 }),
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
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

async function callGeminiWithImage(message: string, imageData: string, imageName: string, isInitialQuestion: boolean): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const systemPrompt = isInitialQuestion 
    ? `You are a helpful GCSE Maths tutor. When a student uploads a math question image, provide a clear, step-by-step explanation of how to solve it. Be encouraging and explain each step thoroughly. Use LaTeX for mathematical expressions when appropriate.`
    : `You are a helpful GCSE Maths tutor. Continue helping the student with their math question. Provide clear explanations, step-by-step solutions, and encouragement. Use LaTeX for mathematical expressions when appropriate.`;

  const userPrompt = isInitialQuestion 
    ? `I've uploaded a photo of a math question. Please analyze the image and provide a step-by-step explanation of how to solve this problem.`
    : message || 'Please continue helping me with this math question.';

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
              data: imageData.replace('data:image/jpeg;base64,', '')
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 32,
      topP: 1,
      maxOutputTokens: 2000,
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
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}
