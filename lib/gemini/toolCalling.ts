/**
 * Gemini Tool Calling Handler
 * 
 * Enables Gemini to call MCP tools directly using native function calling.
 * This replaces the NLU parser with Gemini's language understanding.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getToolsForGemini } from '@/lib/mcp/toolRegistry';
import { executeQuery } from '@/lib/mcp/mcpClient';
// import { selectToolsForMessage } from '@/lib/tool-rag/retriever'; // DISABLED FOR BUILD TESTING

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

/**
 * System prompt for Gemini with tool calling instructions
 */
const SYSTEM_INSTRUCTION = `You are a Real Estate AI Assistant for Abu Dhabi, UAE.

CRITICAL DISCOVERY WORKFLOW:
1. **SEARCH FIRST**: If the user mentions ANY location (District, Project, or Community), you MUST first call \`search_geospatial_metadata\` to confirm its name and existence.
   - Example: User asks "sales in Yas" -> Call \`search_geospatial_metadata(query="Yas")\`
   - Example: User asks "transactions in جزيرة ياس" -> Call \`search_geospatial_metadata(query="جزيرة ياس")\`

2. **USE METADATA**: The search tool will return the VALID English name (e.g., "YAS ISLAND"). Use THIS name for subsequent data tools.
   - Do NOT guess names. Do NOT translating manually. Trust the search tool.

3. **GET DATA**: Once you have the valid name from step 2, call the appropriate data tool.
   - Example: Search returned "YAS ISLAND" -> Call \`get_transaction_count(district="YAS ISLAND", year=2024)\`

4. **MULTILINGUAL**: You understand English and Arabic. Always respond in the user's language, but use English names for tool arguments (from step 2).

5. **NEVER GUESS**: If search returns no results, tell the user you couldn't find that location.

6. **FORMAT**: Format numbers clearly (e.g., 1.5B AED, 1500 units).`;

/**
 * Ask Gemini with tool calling capability
 */
export async function askGeminiWithTools(
  userMessage: string,
  conversationHistory: Array<{ role: string; parts: any[] }> = []
): Promise<string> {
  const requestId = Date.now();
  let geminiCallCount = 0;
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[REQUEST ${requestId}] USER MESSAGE: "${userMessage}"`);
    console.log(`${'='.repeat(80)}\n`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // === TOOL-RAG DISABLED FOR BUILD TESTING ===
    // Use all tools (no selection) to bypass Tool-RAG system entirely
    console.log(`[${requestId}] Tool-RAG DISABLED - using all tools`);

    // Get tools in Gemini-compatible format (all tools)
    const geminiTools = getToolsForGemini();

    console.log(`[${requestId}] Available tools: ${geminiTools.length}`);
    console.log(`[${requestId}] Tools: ${geminiTools.map(t => t.name).join(', ')}\n`);

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

    geminiCallCount++;
    console.log(`[${requestId}] 🔵 GEMINI API CALL #${geminiCallCount}: Sending initial message`);
    const startTime = Date.now();
    
    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    
    console.log(`[${requestId}] ✅ GEMINI RESPONSE #${geminiCallCount} (${Date.now() - startTime}ms)`);

    // Loop to handle potential multi-turn tool calling (Recursive Tool Execution)
    // Examples: Search -> Results -> Data Query -> Results -> Final Answer
    const MAX_TOOL_LOOPS = 5;
    let loopCount = 0;

    while (loopCount < MAX_TOOL_LOOPS) {
      // Check if Gemini wants to call any functions
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        // No tool needed, Gemini responded directly
        const directResponse = response.text();
        console.log(`[${requestId}] ⚪ No tool calls needed, direct response`);
        console.log(`[${requestId}] TOTAL GEMINI API CALLS: ${geminiCallCount}`);
        console.log(`${'='.repeat(80)}\n`);
        return directResponse;
      }

      // We have tools to execute
      loopCount++;
      console.log(`[${requestId}] 🔧 Function calls requested (Loop ${loopCount}): ${functionCalls.length}`);
      
      const functionResponses = [];
      
      for (let i = 0; i < functionCalls.length; i++) {
        const functionCall = functionCalls[i];
        const toolName = functionCall.name;
        const toolArgs = functionCall.args;

        console.log(`[${requestId}]   Tool ${i+1}/${functionCalls.length}: ${toolName}(${JSON.stringify(toolArgs).substring(0, 100)}...)`);

        try {
          const toolStartTime = Date.now();
          // Execute through MCP
          const toolResult = await executeQuery(toolName, toolArgs);
          
          const resultLength = typeof toolResult === 'string' ? toolResult.length : JSON.stringify(toolResult).length;
          console.log(`[${requestId}]   ✅ Tool result: ${resultLength} chars (${Date.now() - toolStartTime}ms)`);

          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { result: toolResult }
            }
          });
        } catch (error: any) {
          console.error(`[${requestId}]   ❌ Tool ${toolName} failed:`, error.message);
          
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { error: error.message || 'Tool execution failed' }
            }
          });
        }
      }

      // Send function results back to Gemini and get the NEXT response
      geminiCallCount++;
      console.log(`\n[${requestId}] 🔵 GEMINI API CALL #${geminiCallCount}: Sending tool results back`);
      const loopStartTime = Date.now();
      
      // IMPORTANT: update the 'result' and 'response' variables for the next iteration
      result = await chat.sendMessage(functionResponses);
      response = result.response;

      console.log(`[${requestId}] ✅ GEMINI RESPONSE #${geminiCallCount} (${Date.now() - loopStartTime}ms)`);
    }

    // If we get here, we exceeded max loops
    console.error(`[${requestId}] ⚠️ Max tool loops (${MAX_TOOL_LOOPS}) exceeded.`);
    return "I'm having trouble processing your request (too many steps). Please try a simpler question.";

  } catch (error: any) {
    console.error(`[${requestId}] ❌ GEMINI ERROR after ${geminiCallCount} API calls:`, error.message);
    console.log(`${'='.repeat(80)}\n`);
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
