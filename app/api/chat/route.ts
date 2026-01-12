import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Initialize the model - using gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a simple prompt
    const prompt = `You are a GeoAI Assistant for Abu Dhabi Real Estate. You can provide information on sales, rentals, and property supply, and even visualize it on a map. What are you interested in today?

User: ${message}

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
