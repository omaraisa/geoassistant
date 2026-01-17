const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  // Try to access the API key directly to debug
  console.log("API Key available:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  console.log("API Key length:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? process.env.GOOGLE_GENERATIVE_AI_API_KEY.length : 0);

  // We can't list models easily with this SDK version directly via helper, but we can try other known model names
  const modelsToTest = [
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest"
  ];

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("hi");
      console.log(`✅ ${modelName} SUCCESS`);
    } catch (error) {
      console.log(`❌ ${modelName} FAILED: ${error.message.split('\n')[0]}`);
    }
  }
}

listModels();