
export enum AppStep {
  INPUT = 'INPUT',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  SELECTION = 'SELECTION',
  EXERCISE = 'EXERCISE',
  SUMMARY = 'SUMMARY',
  SETTINGS = 'SETTINGS'
}

export enum WordCategory {
  VERB = 'VERB',
  NOUN = 'NOUN',
  ADJECTIVE = 'ADJECTIVE'
}

export enum ExerciseMode {
  WRITE = 'WRITE',
  PUZZLE = 'PUZZLE',
  BASE_FORM = 'BASE_FORM',
  EXTEND = 'EXTEND'
}

export enum Tense {
  PRAESENS = 'Präsens',
  PRAETERITUM = 'Präteritum',
  PERFEKT = 'Perfekt',
  PLUSQUAMPERFEKT = 'Plusquamperfekt',
  FUTUR_I = 'Futur I'
}

// --- VERBS ---
export interface VerbDefinition {
  original: string;
  lemma: string;
  detectedTense: Tense | string;
  detectedPerson?: string; // e.g. "ich", "er/sie/es"
  positionIndex?: number;
}

export interface ConjugationTable {
  ich: string;
  du: string;
  er_sie_es: string;
  wir: string;
  ihr: string;
  sie_Sie: string;
  [key: string]: string;
}

// --- NOUNS ---
export interface NounDefinition {
  original: string;
  lemma: string; // Singular Nominativ (e.g. "Leopard")
  article: string; // der, die, das
  plural: string; // Leoparden
  pluralArticle: string; // die
}

// --- ADJECTIVES ---
export interface AdjectiveDefinition {
  original: string;
  lemma: string; // Positiv: "schnell"
  komparativ: string; // "schneller"
  superlativ: string; // "am schnellsten"
}

// Generic container for selection step
export interface WordItem {
  id: string;
  category: WordCategory;
  text: string; // Display text
  subText?: string; // e.g. Tense or Article
  data: VerbDefinition | NounDefinition | AdjectiveDefinition;
}

export interface ExerciseResult {
  verb: string; // Used as "Label"
  tense: string; // Used as "SubLabel"
  correctCount: number;
  totalCount: number;
  usedAudio?: boolean;
}

export interface UserAnswer {
  // For Verbs (Conjugation)
  ich?: string;
  du?: string;
  er_sie_es?: string;
  wir?: string;
  ihr?: string;
  sie_Sie?: string;
  
  // For Verbs (Base Form Mode)
  baseForm?: string;
  conjugated?: string;

  // For Verbs (Extend Mode)
  extendBase?: string;
  extendPrefix?: string;
  
  // For Nouns
  singular?: string;
  plural?: string;

  // For Adjectives
  positiv?: string; // New field
  komparativ?: string;
  superlativ?: string;
}
