import { NextRequest, NextResponse } from 'next/server';
import { askGeminiWithTools, type ConversationTurn } from '@/lib/gemini/toolCalling';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    console.log('[Chat API] Received message:', message);
    console.log('[Chat API] History length:', history.length);

    // Convert client history to Gemini format
    const geminiHistory: ConversationTurn[] = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    // Use Gemini's native tool calling with conversation history
    const response = await askGeminiWithTools(message, geminiHistory);

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
