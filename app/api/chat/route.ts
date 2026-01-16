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
    const result = await askGeminiWithTools(message, geminiHistory);

    console.log('[Chat API] Response generated, length:', result.response.length);
    if (result.chartData) {
      console.log('[Chat API] Chart data available:', result.chartData.title);
    }

    return NextResponse.json({ 
      response: result.response,
      chartData: result.chartData 
    });
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
