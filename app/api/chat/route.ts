import { NextRequest, NextResponse } from 'next/server';
import { examPaperServiceServer } from '@/services/examPaperServiceServer';
import { initializeServerFirebase } from '@/config/firebase';

// Types for better type safety
interface ChatRequest {
  message?: string;
  imageData?: string;
  imageName?: string;
  model?: string;
}

interface ChatResponse {
  reply: string;
  apiUsed: string;
  extractedQuestion?: string;
  isImageQuestion?: boolean;
  examMetadata?: any;
  randomQuestion?: any;
  isRandomGenerated?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Firebase on server side
    initializeServerFirebase();
    
    const requestBody: ChatRequest = await req.json();
    let { message, imageData, imageName, model } = requestBody;
    const originalMessage = message;
    
    // Handle blank input by generating a random question
    if ((!message || message.trim() === '') && (!imageData || !imageName)) {
      console.log('🎲 Generating random past paper question for AI processing...');
      try {
        const randomQuestions = await examPaperServiceServer.getRandomExamQuestions(1);
        const selectedQuestion = randomQuestions[0];
        
        if (!selectedQuestion) {
          return NextResponse.json({ error: 'No random question available' }, { status: 500 });
        }
        
        message = selectedQuestion.question;
        console.log('🎯 Processing random question:', message);
      } catch (error) {
        console.error('Error getting random question from Firestore:', error);
        return NextResponse.json({ error: 'Failed to generate random question' }, { status: 500 });
      }
    }
    
    // Validate input
    if ((!message || typeof message !== 'string') && (!imageData || !imageName)) {
      return NextResponse.json({ error: 'Missing message or image' }, { status: 400 });
    }

    // Process the request and get AI response
    const { reply, apiUsed } = await processAIRequest(message, imageData, imageName, model);
    
    if (!reply) {
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }

    // Normalize LaTeX formatting
    const normalizedReply = normalizeLatex(reply);

    // Handle image questions with question extraction
    if (imageData && imageName) {
      return await handleImageQuestion(normalizedReply, apiUsed, imageName);
    }

    // Handle random question generation
    if (!originalMessage || originalMessage.trim() === '') {
      const formattedReply = await formatChatReply(message!, normalizedReply);
      return NextResponse.json({ 
        randomQuestion: message,
        reply: formattedReply,
        isRandomGenerated: true,
        apiUsed
      });
    }
    
    // Format the reply for normal messages
    const formattedReply = await formatChatReply(message!, normalizedReply);
    return NextResponse.json({ reply: formattedReply, apiUsed });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      reply: 'I\'m experiencing some technical difficulties right now, but I\'m here to help with GCSE Maths! Please try asking your question again, or if the problem persists, you can:\n\n1. Check your internet connection\n2. Try refreshing the page\n3. Ask a simpler question to start with\n\nI\'m designed to help with algebra, geometry, fractions, statistics, and trigonometry - so feel free to ask anything!'
    });
  }
}

// Process AI request and return response
async function processAIRequest(
  message: string | undefined, 
  imageData: string | undefined, 
  imageName: string | undefined, 
  model: string | undefined
): Promise<{ reply: string; apiUsed: string }> {
  const systemPrompt = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math.';
  
  if (imageData && imageName) {
    return await processImageRequest(message, imageData, imageName, model);
  } else {
    return await processTextRequest(message, model);
  }
}

// Process image requests
async function processImageRequest(
  message: string | undefined, 
  imageData: string, 
  imageName: string, 
  model: string | undefined
): Promise<{ reply: string; apiUsed: string }> {
  console.log('🔍 Image processing - Selected model:', model);
  
  // Try ChatGPT first for images if specified
  if (model === 'chatgpt-5' || model === 'chatgpt-4o') {
    try {
      const reply = await callChatGPT(message || 'Please analyze the uploaded image and provide mathematical assistance.', model, imageData, imageName);
      const apiUsed = model === 'chatgpt-5' ? 'OpenAI GPT-5' : 'OpenAI GPT-4 Omni';
      return { reply, apiUsed };
    } catch (error) {
      console.log('ChatGPT image analysis failed, trying Gemini...');
    }
  }
  
  // Try Gemini for images
  try {
    const reply = await callGeminiWithImage(message || 'Please analyze the uploaded image and provide mathematical assistance.', imageData, imageName);
    return { reply, apiUsed: 'Google Gemini 2.0 Flash Exp' };
  } catch (error) {
    console.log('Gemini image analysis failed, trying ChatGPT as fallback...');
    try {
      const reply = await callChatGPT(message || 'Please analyze the uploaded image and provide mathematical assistance.', 'chatgpt-4o', imageData, imageName);
      return { reply, apiUsed: 'OpenAI GPT-4 Omni' };
    } catch (chatgptError) {
      console.error('Both Gemini and ChatGPT failed for image:', { error, chatgptError });
      return {
        reply: `I can see you've uploaded an image! Since both AI services are having issues, could you please:\n\n1. **Describe what you see** in the image\n2. **Tell me the specific question** or problem\n3. **Share any equations or numbers** shown\n\nI'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`,
        apiUsed: 'Fallback Response'
      };
    }
  }
}

// Process text requests
async function processTextRequest(
  message: string | undefined, 
  model: string | undefined
): Promise<{ reply: string; apiUsed: string }> {
  console.log('🔍 Text processing - Selected model:', model);
  
  // Try ChatGPT first if specified
  if (model === 'chatgpt-5' || model === 'chatgpt-4o') {
    try {
      const reply = await callChatGPT(message!, model);
      const apiUsed = model === 'chatgpt-5' ? 'OpenAI GPT-5' : 'OpenAI GPT-4 Omni';
      return { reply, apiUsed };
    } catch (error) {
      console.log('ChatGPT failed, trying Gemini...');
    }
  }
  
  // Try Gemini
  try {
    const reply = await callGemini(message!);
    return { reply, apiUsed: 'Google Gemini 2.0 Flash Exp' };
  } catch (error) {
    console.log('Gemini failed, trying ChatGPT as fallback...');
    try {
      const reply = await callChatGPT(message!, 'chatgpt-4o');
      return { reply, apiUsed: 'OpenAI GPT-4 Omni' };
    } catch (chatgptError) {
      console.error('Both Gemini and ChatGPT failed for text:', { error, chatgptError });
      throw new Error('All AI services unavailable');
    }
  }
}

// Handle image questions with question extraction
async function handleImageQuestion(
  reply: string, 
  apiUsed: string, 
  imageName: string
): Promise<NextResponse<ChatResponse>> {
  // Try to extract question text from AI response
  const questionTextMatch = reply.match(/QUESTION_TEXT:\s*([\s\S]+?)(?:\n\n|$)/);
  
  if (questionTextMatch) {
    const extractedQuestionText = questionTextMatch[1].trim();
    console.log('📝 Extracted question text from image:', extractedQuestionText);
    
    // Remove the QUESTION_TEXT part from the reply
    const cleanedReply = reply.replace(/QUESTION_TEXT:\s*[\s\S]+?(?:\n\n|$)/, '').trim();
    
    // Check if extracted text matches any past paper questions
    const examMetadata = await examPaperServiceServer.detectExamQuestion(extractedQuestionText);
    
    if (examMetadata) {
      console.log('📋 Found exam metadata for extracted text:', examMetadata);
      const formattedReply = await formatChatReply(extractedQuestionText, cleanedReply);
      return NextResponse.json({ 
        reply: formattedReply, 
        apiUsed,
        extractedQuestion: extractedQuestionText,
        isImageQuestion: true,
        examMetadata: examMetadata
      });
    } else {
      const formattedReply = await formatChatReply(extractedQuestionText, cleanedReply);
      return NextResponse.json({ 
        reply: formattedReply, 
        apiUsed,
        extractedQuestion: extractedQuestionText,
        isImageQuestion: true
      });
    }
  } else {
    // No question text extracted, but still an image question
    return NextResponse.json({ 
      reply: await formatChatReply(`[📷 Image: ${imageName}]`, reply), 
      apiUsed,
      isImageQuestion: true,
      imageName: imageName
    });
  }
}

// Format chat reply with Question and Answer template
async function formatChatReply(userMessage: string, aiReply: string): Promise<string> {
  const question = userMessage.trim();
  const answer = aiReply.trim();
  
  // Check if the question matches a past exam question
  const examMetadata = await examPaperServiceServer.detectExamQuestion(question);
  
  let formattedReply = '';
  
  // Add exam metadata if detected
  if (examMetadata) {
    formattedReply += `${examPaperServiceServer.formatExamMetadata(examMetadata)}\n\n---\n\n`;
  }
  
  // Add Question and Answer sections
  formattedReply += `**Question:**\n\n${question}\n\n---\n\n\n**Answer:**\n\n${answer}`;
  
  return formattedReply;
}

// ChatGPT API function
async function callChatGPT(message: string, model: string = 'gpt-4o', imageData?: string, imageName?: string): Promise<string> {
  try {
    console.log('Calling ChatGPT API with model:', model);
    
    // Map model selection to actual OpenAI model names
    let openaiModel = 'gpt-4o';
    if (model === 'chatgpt-5') {
      openaiModel = 'gpt-5';
    } else if (model === 'chatgpt-4o') {
      openaiModel = 'gpt-4o';
    }
    
    console.log('🔍 Using OpenAI model:', openaiModel);
    
    // Prepare messages array
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.\n\nIMPORTANT: Always include visual aids in your explanations:\n- Create ASCII diagrams for geometric problems\n- Use step-by-step annotations with arrows (→) and explanations\n- Draw simple coordinate grids, number lines, or shapes using text characters\n- Add visual representations like: |--|--|--| for number lines, or basic shapes using *, +, -, | characters\n- Include detailed step-by-step breakdowns with clear annotations\n- Use visual spacing and formatting to make solutions easy to follow'
      }
    ];

    // Handle image + text or text-only messages
    if (imageData && imageName) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message || 'Please analyze this image and help me with the GCSE Maths question.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`,
              detail: 'high'
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }
    
    // Make API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('ChatGPT response received');
      return data.choices[0]?.message?.content || 'I understand your question. Let me help you with that.';
    } else {
      const errorData = await response.text();
      console.error('ChatGPT API error:', response.status, response.statusText);
      console.error('Error details:', errorData);
      
      // If gpt-5 fails, try gpt-4o as fallback
      if (model === 'chatgpt-5' && openaiModel === 'gpt-5') {
        console.log('🔄 gpt-5 failed, trying gpt-4o as fallback...');
        return await callChatGPT(message, 'chatgpt-4o');
      }
      
      throw new Error(`ChatGPT API error: ${response.status} - ${errorData}`);
    }
  } catch (error) {
    console.error('ChatGPT API call failed:', error);
    throw error;
  }
}

// Gemini API function
async function callGemini(message: string): Promise<string> {
  try {
    console.log('Calling Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.

IMPORTANT: Always include visual aids in your explanations:
- Create ASCII diagrams for geometric problems
- Use step-by-step annotations with arrows (→) and explanations
- Draw simple coordinate grids, number lines, or shapes using text characters
- Add visual representations like: |--|--|--| for number lines, or basic shapes using *, +, -, | characters
- Include detailed step-by-step breakdowns with clear annotations
- Use visual spacing and formatting to make solutions easy to follow

User question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Gemini response received');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I understand your question. Let me help you with that.';
    } else {
      console.error('Gemini API error:', response.status, response.statusText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Gemini API function with image support
async function callGeminiWithImage(message: string, imageData: string, imageName: string): Promise<string> {
  try {
    console.log('Calling Gemini API with image...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry.

CRITICAL: When analyzing an image containing a mathematics question, you MUST:

1. FIRST: Extract and provide the EXACT text of the question from the image
2. SECOND: Provide your detailed solution with visual aids

Format your response EXACTLY like this:
QUESTION_TEXT: [Extract the exact question text here]

[Then provide your detailed solution with visual aids below]

IMPORTANT: Always include visual aids in your explanations:
- Create ASCII diagrams for geometric problems
- Use step-by-step annotations with arrows (→) and explanations
- Draw simple coordinate grids, number lines, or shapes using text characters
- Add visual representations like: |--|--|--| for number lines, or basic shapes using *, +, -, | characters
- Include detailed step-by-step breakdowns with clear annotations
- Use visual spacing and formatting to make solutions easy to follow
- When analyzing images, recreate the diagram using ASCII characters and add clear annotations

User message: ${message}

Please analyze the uploaded image, extract the question text, and provide mathematical assistance with visual diagrams and annotations.`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData.split(',')[1] // Remove the "data:image/jpeg;base64," prefix
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Gemini image response received');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I can see the image! Let me analyze it and help you with the mathematical problem.';
    } else {
      console.error('Gemini image API error:', response.status, response.statusText);
      throw new Error(`Gemini image API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Gemini image API call failed:', error);
    throw error;
  }
}

// Normalize LaTeX formatting for better rendering
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


