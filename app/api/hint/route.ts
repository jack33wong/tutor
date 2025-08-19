import { NextRequest, NextResponse } from 'next/server';

type HintRequestBody = {
  question: string;
  studentAnswer: string;
  options?: string[];
  type?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HintRequestBody;
    const { question, studentAnswer, options, type } = body || {};

    if (!question || !studentAnswer) {
      return NextResponse.json({ error: 'Missing question or studentAnswer' }, { status: 400 });
    }

    const apiUrl = process.env.HINTS_API_URL || 'https://www.apifreellm.com/api/chat';
    const apiKey = process.env.HINTS_API_KEY;

    const systemInstructions = `You are a GCSE Maths tutor. Provide a concise, encouraging hint (max 35 words) to guide the student toward the correct answer without revealing it. If multiple-choice, suggest eliminating wrong options. Use plain language.`;
    const contextParts: string[] = [
      `Question: ${question}`,
      `Student Answer: ${studentAnswer}`,
    ];
    if (type) contextParts.push(`Type: ${type}`);
    if (options && options.length > 0) contextParts.push(`Options: ${options.join(', ')}`);
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
      // Fallback simple heuristic hint if external API fails
      const base = 'Think about the key concept and units. Rewrite the problem in smaller steps';
      const mcq = options && options.length > 0 ? ' and eliminate options that violate basic rules' : '';
      hintText = `${base}${mcq}. Check your operations and try again.`;
    }

    return NextResponse.json({ hint: hintText });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}


