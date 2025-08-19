import { NextRequest, NextResponse } from 'next/server';

type HintRequestBody = {
  question: string;
  studentAnswer: string;
  options?: string[];
  type?: string;
  marks?: number;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HintRequestBody;
    const { question, studentAnswer, options, type, marks, topic, subtopic, difficulty } = body || {};

    if (!question || !studentAnswer) {
      return NextResponse.json({ error: 'Missing question or studentAnswer' }, { status: 400 });
    }

    const apiUrl = process.env.HINTS_API_URL || 'https://www.apifreellm.com/api/chat';
    const apiKey = process.env.HINTS_API_KEY;

    const systemInstructions = `You are a GCSE Maths tutor. Provide a concise, encouraging hint (max 40 words) to guide the student toward the correct answer without revealing it. Consider the question type, marks, topic, and difficulty level. If multiple-choice, suggest eliminating wrong options. Use plain language and mathematical terminology appropriate for GCSE level.`;
    
    const contextParts: string[] = [
      `Question: ${question}`,
      `Student Answer: ${studentAnswer}`,
      `Question Type: ${type || 'unknown'}`,
      `Marks: ${marks || 'unknown'}`,
      `Topic: ${topic || 'unknown'}`,
      `Subtopic: ${subtopic || 'unknown'}`,
      `Difficulty: ${difficulty || 'unknown'}`
    ];
    
    if (options && options.length > 0) {
      contextParts.push(`Options: ${options.join(', ')}`);
    }
    
    const message = `${systemInstructions}\n\n${contextParts.join('\n')}`;

    let hintText: string | null = null;

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ message }),
        // Avoid edge timeouts
        cache: 'no-store',
      });

      if (resp.ok) {
        const data: any = await resp.json();
        // Try common fields
        hintText = data?.hint || data?.response || data?.message || data?.content || null;
        if (!hintText && typeof data === 'string') hintText = data;
      }
    } catch (_) {
      // Swallow external API errors and fall back
    }

    if (!hintText) {
      // Fallback context-aware hint if external API fails
      let baseHint = 'Think about the key concept and break the problem into smaller steps.';
      
      if (type === 'multiple-choice' && options && options.length > 0) {
        baseHint += ' Try eliminating options that violate basic mathematical rules.';
      } else if (type === 'long-answer') {
        baseHint += ' Show your working step by step.';
      } else if (marks && marks > 3) {
        baseHint += ' This question is worth several marks, so show detailed working.';
      }
      
      if (topic === 'algebra') {
        baseHint += ' Remember to collect like terms and check your signs.';
      } else if (topic === 'geometry') {
        baseHint += ' Draw a diagram if it helps visualize the problem.';
      } else if (topic === 'number') {
        baseHint += ' Check your calculations and consider using estimation.';
      }
      
      hintText = baseHint;
    }

    return NextResponse.json({ hint: hintText });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}


