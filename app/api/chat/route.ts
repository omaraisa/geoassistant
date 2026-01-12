import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { parseQuery } from '@/lib/nlu/queryParser';
import { executeQuery } from '@/lib/mcp/mcpClient';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    console.log('[Chat API] Received message:', message);

    // Try to parse as structured query first
    const parsedQuery = parseQuery(message);
    console.log('[Chat API] Parsed query:', parsedQuery);
    
    let mcpResponse: string | null = null;
    
    if (parsedQuery && parsedQuery.confidence > 0.7) {
      // Execute through MCP
      try {
        console.log('[Chat API] Executing MCP query:', parsedQuery.tool, parsedQuery.entities);
        mcpResponse = await executeQuery(parsedQuery.tool, parsedQuery.entities);
        console.log('[Chat API] MCP Response:', mcpResponse);
      } catch (mcpError) {
        console.error('[Chat API] MCP Error:', mcpError);
        // Fall back to LLM if MCP fails
      }
    } else {
      console.log('[Chat API] No high-confidence parse, using pure LLM');
    }

    // Initialize the model - using gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create enhanced prompt with MCP data
    let prompt = '';
    
    if (mcpResponse) {
      // STRICT MODE: Force LLM to only use provided data
      prompt = `You are a GeoAI Assistant for Abu Dhabi Real Estate connected to a real-time database.

CRITICAL INSTRUCTIONS:
- You MUST ONLY use the data provided below from our database
- DO NOT use any general knowledge or make up numbers
- DO NOT estimate or approximate values
- If asked about data not in the provided information, say "I don't have that specific data available"

DATABASE QUERY RESULT:
${mcpResponse}

Now answer this user question using ONLY the data above:
${message}

Provide a clear, conversational response that directly references the numbers from the database.`;
    } else {
      // Fallback mode: Let LLM know it doesn't have live data
      prompt = `You are a GeoAI Assistant for Abu Dhabi Real Estate. 

IMPORTANT: You do NOT have access to live data for this query. Please let the user know that you need a more specific question to query the database. 

User asked: ${message}

Respond professionally and suggest they ask more specific questions like:
- "What was the total sales value in [District] in [Year]?"
- "Compare sales between [District1] and [District2]"
- "Show me rental units within [Budget] with [Bedrooms]"
- "What is the current supply in [District]?"`;
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('[Chat API] Generated response length:', text.length);
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
