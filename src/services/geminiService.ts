import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getTutorResponse = async (prompt: string, language: string = "English") => {
  const model = (genAI as any).getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const systemPrompt = `You are SomaAI, an interactive AI tutor designed to help students understand complex topics simply. 
  Your goal is to explain concepts using vivid analogies (e.g., "The heart is like a pump in a building"), provide real-world examples, and ALWAYS ask at least one interactive follow-up question to gauge the student's understanding.
  
  Guidelines:
  1. Use simple language but don't oversimplify to the point of inaccuracy.
  2. Use analogies for every new or complex concept introduced.
  3. End every response with a question that requires the student to apply what they just learned.
  4. Current language: ${language}.
  5. Always be encouraging and patient. If a topic can be visualized (skeleton, engine, cell, solar system), mention the 3D model.`;

  const result = await model.generateContent([systemPrompt, prompt]);
  return result.response.text();
};

export const analyzeNotes = async (notes: string, language: string = "English") => {
  const model = (genAI as any).getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `Analyze the following student notes and provide:
  1. A simplified explanation using vivid analogies.
  2. Key takeaways in bullet points.
  3. 3 interactive follow-up questions to gauge their understanding and encourage critical thinking.
  
  Language: ${language}
  Notes: ${notes}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const getLessonPlanResponse = async (prompt: string, language: string = "English") => {
  const model = (genAI as any).getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const systemPrompt = `You are SomaAI Lesson Planner, an expert educational consultant. 
  Your goal is to help teachers create engaging lesson plans, discover educational resources, 
  and suggest interactive activities (including 3D models like skeletons, engines, cells, and the solar system).
  Current language: ${language}.
  Provide structured lesson plans with objectives, materials, procedures, and assessment ideas.`;

  const result = await model.generateContent([systemPrompt, prompt]);
  return result.response.text();
};

export const generateQuiz = async (topic: string, language: string = "English") => {
  const model = (genAI as any).getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `Generate a short multiple-choice quiz about "${topic}" in ${language}. 
  Return ONLY a JSON object with the following structure:
  {
    "title": "Quiz Title",
    "questions": [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Why this is correct"
      }
    ]
  }
  Provide exactly 3 questions. Ensure the questions test comprehension and application of the topic.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
};
