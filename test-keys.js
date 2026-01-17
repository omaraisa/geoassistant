const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEYS = [
    "AIzaSyA3qZOaXXBCdVgOCVRqruE_0U0NxDcxIOo",
    "AIzaSyCd-sdQInmKN3spQqNjN4e1O2pQRsBV05Q",
    "AIzaSyAqWm7BdGCvM5hg8zgvgNHLJ_4s3cqWx7E",
    "AIzaSyD4FawZaGy2iIdLte2z9nsKr0L14GPAhRo",
  "AIzaSyAP2clj7PL0zN1xdM9MU2BLAFAzSKWiXEg"
];

async function testKey(apiKey, index) {
  console.log(`\n--- Testing Key ${index + 1} ---`);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // First, let's try to list models to see if the key is even valid for AI
    try {
      // The SDK doesn't have a direct listModels, but we can try a fetch
      // Or just try a more generic model name
    } catch (e) {}

    const modelNames = ["gemini-2.5-flash","gemini-2.0-flash"]; 
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'OK'");
        const response = await result.response;
        // Print last 5 digits of the key on success
        const last5 = apiKey.slice(-5);
        console.log(`✅ ${modelName}: ${response.text().trim()} [Key ending: ${last5}]`);
        return true;
      } catch (e) {
        if (e.message.includes("429")) {
          console.error(`❌ ${modelName}: Quota exhausted (429)`);
          return false;
        } else if (e.message.includes("404")) {
           // Continue to next model
           continue;
        } else {
          throw e;
        }
      }
    }
    console.error(`❌ No 2.0/2.5 models found or supported for this key.`);
  } catch (error) {
    const msg = error.message || "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      console.error(`❌ Quota exhausted (429)`);
    } else if (msg.includes("404")) {
      console.error(`❌ Model not found or Key invalid (404)`);
    } else if (msg.includes("403")) {
      console.error(`❌ Permission denied - API may not be enabled (403)`);
    } else if (msg.includes("API key not valid")) {
      console.error(`❌ API key not valid`);
    } else {
      console.error(`❌ Error: ${msg.substring(0, 150)}...`);
    }
    return false;
  }
}

async function runAllTests() {
  console.log("Starting Gemini API Quota Check...");
  for (let i = 0; i < API_KEYS.length; i++) {
    await testKey(API_KEYS[i], i);
  }
}

runAllTests();
