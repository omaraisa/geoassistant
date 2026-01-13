/**
 * Gemini Tool Calling Handler
 * 
 * Enables Gemini to call MCP tools directly using native function calling.
 * This replaces the NLU parser with Gemini's language understanding.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getToolsForGemini } from '@/lib/mcp/toolRegistry';
import { executeQuery } from '@/lib/mcp/mcpClient';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

/**
 * System prompt for Gemini with tool calling instructions
 */
const SYSTEM_INSTRUCTION = `You are a Real Estate AI Assistant for Abu Dhabi, UAE.

CRITICAL INSTRUCTIONS:
1. You have access to real estate data tools - use them when users ask data questions
2. You understand English, Arabic, and mixed-language queries
3. When user provides Arabic location names, translate them to English before calling tools:
   - "جزيرة ياس" or "ياس" → "YAS ISLAND"
   - "جزيرة الريم" or "الريم" → "AL REEM ISLAND"  
   - "جزيرة السعديات" or "السعديات" → "SAADIYAT ISLAND"
   - "أبو ظبي" → "Abu Dhabi City" (municipality)
   - "العين" → "Al Ain City" (municipality)
4. ALWAYS call tools for data questions - NEVER guess or estimate numbers
5. If tool returns data, use it exactly as provided
6. Respond in the same language the user asked in
7. Be conversational and helpful
8. If you don't know something, say so clearly

IMPORTANT TOOL USAGE:
- For district-level queries: use get_total_sales_value, get_transaction_count
- For municipality-level queries (Abu Dhabi City as a whole): use get_municipality_sales
- For comparisons: use compare_sales_between_districts
- For rentals: use find_units_by_budget
- For supply/inventory: use get_current_supply

Common query patterns:
- "How many transactions..." → get_transaction_count
- "Total sales value..." → get_total_sales_value
- "Compare X and Y..." → compare_sales_between_districts
- "Find rentals for X AED..." → find_units_by_budget
- "Supply in..." → get_current_supply`;

/**
 * Ask Gemini with tool calling capability
 */
export async function askGeminiWithTools(
  userMessage: string,
  conversationHistory: Array<{ role: string; parts: any[] }> = []
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Get tools in Gemini-compatible format
    const geminiTools = getToolsForGemini();

    console.log(`[Gemini] Processing message: "${userMessage}"`);
    console.log(`[Gemini] Available tools: ${geminiTools.length}`);

    // Build conversation history
    const contents = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    // First call: Let Gemini see the message and decide if it needs tools
    const chat = model.startChat({
      tools: [{ functionDeclarations: geminiTools }],
      history: conversationHistory
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    // Check if Gemini wants to call any functions
    const functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      // No tool needed, Gemini responded directly
      console.log('[Gemini] No tool calls needed, direct response');
      return response.text();
    }

    // Execute each tool Gemini requested
    console.log(`[Gemini] Function calls requested: ${functionCalls.length}`);
    
    const functionResponses = [];
    
    for (const functionCall of functionCalls) {
      const toolName = functionCall.name;
      const toolArgs = functionCall.args;

      console.log(`[Gemini→MCP] Calling ${toolName}(${JSON.stringify(toolArgs)})`);

      try {
        // Execute through MCP
        const toolResult = await executeQuery(toolName, toolArgs);
        
        console.log(`[MCP→Gemini] Tool result length: ${typeof toolResult === 'string' ? toolResult.length : JSON.stringify(toolResult).length} chars`);

        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: { result: toolResult }
          }
        });
      } catch (error: any) {
        console.error(`[MCP Error] Tool ${toolName} failed:`, error.message);
        
        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: { error: error.message || 'Tool execution failed' }
          }
        });
      }
    }

    // Send function results back to Gemini
    const result2 = await chat.sendMessage(functionResponses);
    const finalResponse = result2.response.text();

    console.log(`[Gemini] Final response length: ${finalResponse.length} chars`);

    return finalResponse;

  } catch (error: any) {
    console.error('[Gemini Error]', error);
    throw new Error(`Failed to process with Gemini: ${error.message}`);
  }
}

/**
 * Multi-turn conversation support
 */
export interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { functionCall: any } | { functionResponse: any }>;
}

export async function continueConversation(
  userMessage: string,
  history: ConversationTurn[]
): Promise<{ response: string; newHistory: ConversationTurn[] }> {
  const response = await askGeminiWithTools(userMessage, history);
  
  const newHistory = [
    ...history,
    {
      role: 'user' as const,
      parts: [{ text: userMessage }]
    },
    {
      role: 'model' as const,
      parts: [{ text: response }]
    }
  ];

  return { response, newHistory };
}
