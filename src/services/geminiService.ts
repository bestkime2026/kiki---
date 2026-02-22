import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const createChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
  });
};
