import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getTutorResponse = async (prompt: string, language: string = "English") => {
  const systemPrompt = `You are SomaAI, an interactive AI tutor designed to help students understand complex topics simply. 
  Your goal is to explain concepts using vivid analogies (e.g., "The heart is like a pump in a building"), provide real-world examples, and ALWAYS ask at least one interactive follow-up question to gauge the student's understanding.
  
  Guidelines:
  1. Use simple language but don't oversimplify to the point of inaccuracy.
  2. Use analogies for every new or complex concept introduced.
  3. End every response with a question that requires the student to apply what they just learned.
  4. Current language: ${language}.
  5. Always be encouraging and patient. 
  6. If a topic can be visualized using one of the available 3D models, you MUST include the tag [MODEL:type] at the end of your response.
  
  Available 3D Models:
  - skeleton: Human skeletal system.
  - engine: Internal combustion engine with moving pistons.
  - cell: Biological cell with nucleus and mitochondria.
  - solar_system: The sun and inner planets with orbits.
  - heart: A beating human heart.
  - brain: Human brain hemispheres.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt
    }
  });
  
  return response.text;
};

export const analyzeNotes = async (notes: string, language: string = "English") => {
  const prompt = `Analyze the following student notes and provide:
  1. A simplified explanation using vivid analogies.
  2. Key takeaways in bullet points.
  3. 3 interactive follow-up questions to gauge their understanding and encourage critical thinking.
  
  Language: ${language}
  Notes: ${notes}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  return response.text;
};

export const getLessonPlanResponse = async (prompt: string, language: string = "English") => {
  const systemPrompt = `You are SomaAI Lesson Planner, an expert educational consultant. 
  Your goal is to help teachers create engaging lesson plans, discover educational resources, 
  and suggest interactive activities (including 3D models like skeletons, engines, cells, and the solar system).
  Current language: ${language}.
  Provide structured lesson plans with objectives, materials, procedures, and assessment ideas.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt
    }
  });
  
  return response.text;
};

export const generateQuiz = async (topic: string, language: string = "English") => {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
};

export const generateStudyPlan = async (goal: string, language: string = "English") => {
  const prompt = `Create a detailed study plan for the goal: "${goal}" in ${language}. 
  Return ONLY a JSON object with the following structure:
  {
    "goal": "Goal Title",
    "targetDate": "YYYY-MM-DD",
    "tasks": [
      { "title": "Task 1", "completed": false },
      { "title": "Task 2", "completed": false }
    ]
  }
  Provide exactly 5-7 logical tasks. Set a realistic target date (about 2-4 weeks from now).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
};

export const getSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error('TTS Error:', error);
    return null;
  }
};
