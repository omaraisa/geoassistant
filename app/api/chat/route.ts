import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { parseQuery } from '@/lib/nlu/queryParser';
import { executeQuery } from '@/lib/mcp/mcpClient';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Try to parse as structured query first
    const parsedQuery = parseQuery(message);
    
    let mcpResponse: string | null = null;
    
    if (parsedQuery && parsedQuery.confidence > 0.7) {
      // Execute through MCP
      try {
        mcpResponse = await executeQuery(parsedQuery.tool, parsedQuery.entities);
        console.log('[Chat API] MCP Response:', mcpResponse);
      } catch (mcpError) {
        console.error('[Chat API] MCP Error:', mcpError);
        // Fall back to LLM if MCP fails
      }
    }

    // Initialize the model - using gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create enhanced prompt with MCP data
    let prompt = `You are a GeoAI Assistant for Abu Dhabi Real Estate. You can provide information on sales, rentals, and property supply, and even visualize it on a map.`;
    
    if (mcpResponse) {
      prompt += `\n\nHere is real-time data from our database:\n${mcpResponse}\n\nUse this data to provide a helpful, conversational response to the user's question.`;
    }
    
    prompt += `\n\nUser: ${message}

Assistant:`;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
