
import { GoogleGenAI, Type } from "@google/genai";
import { SyllableWord } from "./types";
import { FALLBACK_WORDS } from "./constants";

export const fetchEducationalWords = async (count: number = 9): Promise<SyllableWord[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Erstelle eine Liste von ${count} einfachen deutschen Substantiven für Kinder (genau 2 Silben). Zerlege jedes Wort in genau zwei Silben. Wähle Wörter, die konkrete, leicht verständliche Gegenstände oder Lebewesen benennen. Achte auf korrekte deutsche Rechtschreibung (Groß- und Kleinschreibung, z.B. "Ho-se", "Gar-ten").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fullWord: { type: Type.STRING },
              syllables: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 2,
                maxItems: 2
              }
            },
            required: ["fullWord", "syllables"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Keine Antwort");
    
    const words = JSON.parse(text);
    return words.length > 0 ? words : FALLBACK_WORDS.slice(0, count);
  } catch (error) {
    console.error("Gemini failed, using fallbacks", error);
    // Shuffle fallbacks to provide variety
    return [...FALLBACK_WORDS].sort(() => Math.random() - 0.5).slice(0, count);
  }
};
