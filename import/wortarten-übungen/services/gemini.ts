
import { GoogleGenAI, Type } from "@google/genai";
import { ConjugationTable, Tense, VerbDefinition, NounDefinition, AdjectiveDefinition } from '../types';
import { analyzeTextLocal, getLocalConjugation } from "./verbDatabase";
import { analyzeTextLocalNouns } from "./nounDatabase";
import { analyzeTextLocalAdjectives } from "./adjectiveDatabase";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

// --- Event Bus for AI Usage ---
// Listener accepts a reason string now
type AiUsageListener = (reason: string) => void;
const listeners: Set<AiUsageListener> = new Set();

export const onAiUsed = (listener: AiUsageListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyAiUsed = (reason: string) => {
  listeners.forEach(l => l(reason));
};

// --- VERBS ---

export const analyzeTextForVerbs = async (text: string): Promise<VerbDefinition[]> => {
  const localResults = analyzeTextLocal(text);
  
  if (localResults.length > 0) {
    console.log("Local verb analysis successful.");
    return localResults;
  }
  
  if (!process.env.API_KEY) {
    return localResults;
  }

  try {
    const prompt = `
      Analysiere den Text. Extrahiere alle Verben.
      Gib für jedes Verb:
      - 'original': Das Wort im Text.
      - 'lemma': Grundform.
      - 'detectedTense': Zeitform (z.B. Präsens).
      - 'detectedPerson': Person/Pronomen (z.B. "ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie").
      Text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              lemma: { type: Type.STRING },
              detectedTense: { type: Type.STRING },
              detectedPerson: { type: Type.STRING }
            },
            required: ["original", "lemma", "detectedTense"]
          }
        }
      }
    });

    if (response.text) {
      const apiResults = JSON.parse(response.text) as VerbDefinition[];
      if (apiResults.length > 0) {
        // List unique verbs found
        const distinctLemmas = Array.from(new Set(apiResults.map(v => v.lemma))).join(", ");
        notifyAiUsed(`Verb-Analyse: ${distinctLemmas}`);
        return apiResults;
      }
    }
    return localResults;
  } catch (error) {
    console.warn("API Error:", error);
    return localResults;
  }
};

export const generateConjugation = async (lemma: string, tense: string): Promise<ConjugationTable | null> => {
  const localData = getLocalConjugation(lemma, tense);
  if (localData) return localData;

  if (!process.env.API_KEY) return null;

  try {
    const prompt = `Konjugiere "${lemma}" in der Zeitform "${tense}".`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ich: { type: Type.STRING },
            du: { type: Type.STRING },
            er_sie_es: { type: Type.STRING },
            wir: { type: Type.STRING },
            ihr: { type: Type.STRING },
            sie_Sie: { type: Type.STRING }
          },
          required: ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
        }
      }
    });

    if (response.text) {
      notifyAiUsed(`Konjugation geladen: ${lemma}`);
      return JSON.parse(response.text) as ConjugationTable;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// --- NOUNS ---

export const analyzeTextForNouns = async (text: string): Promise<NounDefinition[]> => {
  // 1. Local Lookup
  const localResults = analyzeTextLocalNouns(text);
  
  if (localResults.length > 0) {
      return localResults;
  }

  if (!process.env.API_KEY) return localResults;

  // 2. API Fallback
  try {
    const prompt = `
      Analysiere den Text. Extrahiere alle Substantive (Nomen).
      Gib für jedes Nomen zurück:
      1. 'original': Das Wort im Text.
      2. 'lemma': Singular Nominativ (z.B. "Haus").
      3. 'article': Bestimmter Artikel Singular (der, die, das).
      4. 'plural': Pluralform (z.B. "Häuser").
      5. 'pluralArticle': Bestimmter Artikel Plural (immer "die").
      
      Text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              lemma: { type: Type.STRING },
              article: { type: Type.STRING },
              plural: { type: Type.STRING },
              pluralArticle: { type: Type.STRING }
            },
            required: ["original", "lemma", "article", "plural", "pluralArticle"]
          }
        }
      }
    });

    if (response.text) {
        const res = JSON.parse(response.text) as NounDefinition[];
        if (res.length > 0) {
            const distinctLemmas = Array.from(new Set(res.map(n => n.lemma))).join(", ");
            notifyAiUsed(`Nomen-Analyse: ${distinctLemmas}`);
        }
        return res;
    }
    return [];
  } catch (e) {
      console.warn(e);
      return [];
  }
};

// --- ADJECTIVES ---

export const analyzeTextForAdjectives = async (text: string): Promise<AdjectiveDefinition[]> => {
    const localResults = analyzeTextLocalAdjectives(text);
    if (localResults.length > 0) return localResults;

    if (!process.env.API_KEY) return localResults;

    try {
        const prompt = `
          Analysiere den Text. Extrahiere alle Adjektive.
          Gib für jedes Adjektiv zurück:
          1. 'original': Das Wort im Text.
          2. 'lemma': Positiv Form (z.B. "schnell").
          3. 'komparativ': Komparativ Form (z.B. "schneller").
          4. 'superlativ': Superlativ Form mit 'am' (z.B. "am schnellsten").
          
          Text: "${text}"
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            lemma: { type: Type.STRING },
                            komparativ: { type: Type.STRING },
                            superlativ: { type: Type.STRING }
                        },
                        required: ["original", "lemma", "komparativ", "superlativ"]
                    }
                }
            }
        });

        if (response.text) {
            const res = JSON.parse(response.text) as AdjectiveDefinition[];
            if (res.length > 0) {
                const distinctLemmas = Array.from(new Set(res.map(n => n.lemma))).join(", ");
                notifyAiUsed(`Adjektiv-Analyse: ${distinctLemmas}`);
            }
            return res;
        }
        return [];
    } catch (e) {
        return [];
    }
};
