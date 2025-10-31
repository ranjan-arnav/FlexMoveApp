import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  },
});

export async function generateChatResponse(
  message: string,
  context: string
): Promise<string> {
  try {
    const prompt = `You are Flexify, the intelligent AI assistant integrated directly into FlexMove's supply chain management platform. You are not a separate tool - you ARE part of FlexMove's core functionality.

${context}

User Question: ${message}

Your Role:
- You're Flexify, FlexMove's built-in intelligence
- Speak as if you're part of the FlexMove system itself
- Use "we" when referring to FlexMove capabilities (e.g., "We track shipments...")
- Provide instant, actionable insights
- Reference specific data from the context (shipment IDs, customer names, etc.)

Communication Style:
- Professional yet conversational
- Direct and concise - get to the point fast
- Use emojis strategically for visual clarity (📦 🚚 ⚠️ ✅ 📊)
- When discussing metrics, give specific numbers
- Always end with a helpful follow-up suggestion if relevant

IMPORTANT Formatting Rules:
- Use plain text without escaping special characters
- Write dollar signs as $ not \\$
- Use bullet points with • not *
- For bold text, use **text** sparingly
- Do NOT escape characters like /, |, $, *, or quotes
- Keep formatting simple and clean

Respond now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateStreamResponse(
  message: string,
  context: string
) {
  try {
    const prompt = `${context}\n\nUser Question: ${message}\n\nProvide a helpful, concise response based on the context above. If the question is about shipments, disruptions, analytics, or supply chain operations, use the provided data. Be conversational and friendly.`;

    const result = await model.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error("Gemini API Stream Error:", error);
    throw error;
  }
}
