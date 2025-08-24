import { NextRequest, NextResponse } from 'next/server';
import { detectExamQuestion, formatExamMetadata, getRandomExamQuestions, formatSuggestedQuestion } from '@/data/pastExamQuestions';
import { addCompletedQuestion, UserProgress, calculateProgressStats, getCompletionStatus } from '@/data/progressTracking';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    let { message, imageData, imageName, model }: { message?: string; imageData?: string; imageName?: string; model?: string } = requestBody;
    const originalMessage = message;
    
    // Check for blank input and generate a random question to process
    if ((!message || message.trim() === '') && (!imageData || !imageName)) {
      console.log('🎲 Generating random past paper question for AI processing...');
      const randomQuestions = getRandomExamQuestions(1);
      const selectedQuestion = randomQuestions[0];
      
      if (!selectedQuestion) {
        return NextResponse.json({ error: 'No random question available' }, { status: 500 });
      }
      
      // Process the random question as if it was user input
      message = selectedQuestion.question;
      console.log('🎯 Processing random question:', message);
      // Continue with normal processing flow below
    }
    
    // Allow requests with either a message or an image
    if ((!message || typeof message !== 'string') && (!imageData || !imageName)) {
      return NextResponse.json({ error: 'Missing message or image' }, { status: 400 });
    }

    // Enhanced system prompt for image handling
    const system = 'You are a friendly Mentara Maths tutor. Be concise and clear. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math.';
    
    // Compose message with image context
    let userMessage = message || 'Please analyze the uploaded image and provide mathematical assistance.';
    let composed = `${system}\n\nUser: ${userMessage}`;
    
    let reply: string | null = null;
    let apiUsed = '';
    
    try {
      
      if (imageData && imageName) {
        // For images, use selected model or default to Gemini
        const selectedModel = model === 'chatgpt' ? 'chatgpt' : 'gemini';
        
        if (selectedModel === 'chatgpt') {
          try {
            reply = await callChatGPT(userMessage);
            apiUsed = 'OpenAI GPT-3.5 Turbo';
          } catch (chatgptError) {
            console.log('ChatGPT image analysis failed, trying Gemini...');
            try {
              reply = await callGeminiWithImage(userMessage, imageData, imageName);
              apiUsed = 'Google Gemini 2.0 Flash Exp';
            } catch (geminiError) {
              console.error('Both ChatGPT and Gemini failed:', { chatgptError, geminiError });
              // Final fallback for images
              reply = `I can see you've uploaded an image! 

Since both AI services are having issues, could you please:

1. **Describe what you see** in the image
2. **Tell me the specific question** or problem
3. **Share any equations or numbers** shown

I'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`;
              apiUsed = 'Fallback Response';
            }
          }
        } else {
          // Default to Gemini for images
          try {
            reply = await callGeminiWithImage(userMessage, imageData, imageName);
            apiUsed = 'Google Gemini 2.0 Flash Exp';
          } catch (geminiError) {
            console.log('Gemini image analysis failed, trying ChatGPT...');
            try {
              reply = await callChatGPT(userMessage);
              apiUsed = 'OpenAI GPT-3.5 Turbo';
            } catch (chatgptError) {
              console.error('Both Gemini and ChatGPT failed:', { geminiError, chatgptError });
              // Final fallback for images
              reply = `I can see you've uploaded an image! 

Since both AI services are having issues, could you please:

1. **Describe what you see** in the image
2. **Tell me the specific question** or problem
3. **Share any equations or numbers** shown

I'm here to help with GCSE Maths and can guide you through solving any mathematical concept!`;
              apiUsed = 'Fallback Response';
            }
          }
        }
      } else {
        // For text-only messages, use selected model or default to Gemini
        const selectedModel = model === 'chatgpt' ? 'chatgpt' : 'gemini';
        
        if (selectedModel === 'chatgpt') {
          try {
            reply = await callChatGPT(userMessage);
            apiUsed = 'OpenAI GPT-3.5 Turbo';
          } catch (chatgptError) {
            console.log('ChatGPT failed, trying Gemini...');
            try {
              reply = await callGemini(userMessage);
              apiUsed = 'Google Gemini 2.0 Flash Exp';
            } catch (geminiError) {
              console.error('Both ChatGPT and Gemini failed:', { chatgptError, geminiError });
              throw new Error('All AI services unavailable');
            }
          }
        } else {
          // Default to Gemini
          try {
            reply = await callGemini(userMessage);
            apiUsed = 'Google Gemini 2.0 Flash Exp';
          } catch (geminiError) {
            console.log('Gemini failed, trying ChatGPT...');
            try {
              reply = await callChatGPT(userMessage);
              apiUsed = 'OpenAI GPT-3.5 Turbo';
            } catch (chatgptError) {
              console.error('Both Gemini and ChatGPT failed:', { geminiError, chatgptError });
              throw new Error('All AI services unavailable');
            }
          }
        }
      }
    } catch (error) {
      console.error('All AI API calls failed:', error);
      // Final fallback response
      reply = 'I\'m here to help with your GCSE Maths questions! Please ask me anything about mathematics, and I\'ll do my best to assist you.';
      apiUsed = 'Fallback Response';
    }

    if (!reply) {
      reply = 'Thanks for your question! Could you share the key steps you tried so far? Focus on units and ensure operations are applied in the correct order.';
    }

    // Normalize LaTeX formatting for better rendering
    reply = normalizeLatex(reply);

    // Check if this was an image with question extraction
    if (imageData && imageName) {
      // Try to extract question text from AI response
      const questionTextMatch = reply.match(/QUESTION_TEXT:\s*([\s\S]+?)(?:\n\n|$)/);
      
      if (questionTextMatch) {
        const extractedQuestionText = questionTextMatch[1].trim();
        console.log('📝 Extracted question text from image:', extractedQuestionText);
        
        // Remove the QUESTION_TEXT part from the reply
        const cleanedReply = reply.replace(/QUESTION_TEXT:\s*[\s\S]+?(?:\n\n|$)/, '').trim();
        
        // Check if extracted text matches any past paper questions
        const examMetadata = detectExamQuestion(extractedQuestionText);
        
        if (examMetadata) {
          console.log('📋 Found exam metadata for extracted text:', examMetadata);
          // Format with exam metadata using extracted text
          const formattedReply = formatChatReply(extractedQuestionText, cleanedReply);
          return NextResponse.json({ reply: formattedReply, apiUsed });
        } else {
          // No exam match, but still format nicely with extracted text
          const formattedReply = formatChatReply(extractedQuestionText, cleanedReply);
          return NextResponse.json({ reply: formattedReply, apiUsed });
        }
      }
    }

    // Check if this was a random question generation
    const wasBlankInput = !originalMessage || originalMessage.trim() === '';
    
    if (wasBlankInput) {
      // For random questions, still format with metadata detection
      const formattedReply = formatChatReply(userMessage, reply);
      return NextResponse.json({ 
        randomQuestion: userMessage,
        reply: formattedReply,
        isRandomGenerated: true,
        apiUsed
      });
    }
    
    // Format the reply with Question and Answer template for normal messages
    const formattedReply = formatChatReply(userMessage, reply);

    return NextResponse.json({ reply: formattedReply, apiUsed });
  } catch (e) {
    console.error('Chat API error:', e);
    // Return a helpful error message instead of failing completely
    return NextResponse.json({ 
      reply: 'I\'m experiencing some technical difficulties right now, but I\'m here to help with GCSE Maths! Please try asking your question again, or if the problem persists, you can:\n\n1. Check your internet connection\n2. Try refreshing the page\n3. Ask a simpler question to start with\n\nI\'m designed to help with algebra, geometry, fractions, statistics, and trigonometry - so feel free to ask anything!'
    });
  }
}

// Format chat reply with Question and Answer template
function formatChatReply(userMessage: string, aiReply: string): string {
  // Clean up the user message for display
  const question = userMessage.trim();
  
  // Clean up the AI reply
  const answer = aiReply.trim();
  
  // Check if the question matches a past exam question
  const examMetadata = detectExamQuestion(question);
  
  // Build the formatted reply
  let formattedReply = '';
  
  // Add exam metadata if detected
  if (examMetadata) {
    formattedReply += `${formatExamMetadata(examMetadata)}\n\n---\n\n`;
  }
  
  // Add Question and Answer sections
  formattedReply += `**Question:**\n\n${question}\n\n---\n\n\n**Answer:**\n\n${answer}`;
  
  return formattedReply;
}

// ChatGPT API function
async function callChatGPT(message: string): Promise<string> {
  try {
    console.log('Calling ChatGPT API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly GCSE Maths tutor called Mentara. Be concise, clear, and helpful. When providing mathematical formulas, use LaTeX format with proper delimiters. For example, use \\[ ... \\] for display math or \\( ... \\) for inline math. Focus on GCSE Maths topics like algebra, geometry, fractions, statistics, and trigonometry. Provide direct answers without repeating the question - the question will be displayed separately.\n\nIMPORTANT: Always include visual aids in your explanations:\n- Create ASCII diagrams for geometric problems\n- Use step-by-step annotations with arrows (→) and explanations\n- Draw simple coordinate grids, number lines, or shapes using text characters\n- Add visual representations like: |--|--|--| for number lines, or basic shapes using *, +, -, | characters\n- Include detailed step-by-step breakdowns with clear annotations\n- Use visual spacing and formatting to make solutions easy to follow'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('ChatGPT response received');
      return data.choices[0]?.message?.content || 'I understand your question. Let me help you with that.';
    } else {
      console.error('ChatGPT API error:', response.status, response.statusText);
      throw new Error(`ChatGPT API error: ${response.status}`);
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


