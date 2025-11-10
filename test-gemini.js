// Test Gemini API to find working model
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyACLt7S6QcpV3hA1YCB9sJ-tde87dgylzs";

async function testModels() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest"
  ];
  
  console.log("🔍 Testing Gemini API models...\n");
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say 'Hello' in one word");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} works! Response: ${text}\n`);
      return modelName; // Return first working model
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}\n`);
    }
  }
  
  console.log("❌ No working model found!");
}

testModels();
