import { NextRequest, NextResponse } from 'next/server';
import { askGeminiWithTools } from '@/lib/gemini/toolCalling';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    console.log('[Chat API] Received message:', message);

    // Use Gemini's native tool calling instead of NLU pre-execution
    const response = await askGeminiWithTools(message);

    console.log('[Chat API] Response generated, length:', response.length);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
