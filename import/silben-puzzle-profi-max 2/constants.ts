
import { SyllableWord } from './types';

export const FALLBACK_WORDS: SyllableWord[] = [
  { fullWord: "Hase", syllables: ["Ha", "se"] },
  { fullWord: "Auto", syllables: ["Au", "to"] },
  { fullWord: "Igel", syllables: ["I", "gel"] },
  { fullWord: "Vogel", syllables: ["Vo", "gel"] },
  { fullWord: "Blume", syllables: ["Blu", "me"] },
  { fullWord: "Sonne", syllables: ["Son", "ne"] },
  { fullWord: "Wolke", syllables: ["Wol", "ke"] },
  { fullWord: "Apfel", syllables: ["Ap", "fel"] },
  { fullWord: "Tisch", syllables: ["Ti", "sche"] },
  { fullWord: "Stuhl", syllables: ["Stuh", "le"] },
  { fullWord: "Löwe", syllables: ["Lö", "we"] },
  { fullWord: "Tiger", syllables: ["Ti", "ger"] },
  { fullWord: "Fisch", syllables: ["Fi", "sche"] },
  { fullWord: "Garten", syllables: ["Gar", "ten"] },
  { fullWord: "Schule", syllables: ["Schu", "le"] }
];

export const COLORS = [
  'bg-blue-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500'
];

export const PUZZLE_PATH_LEFT = 'M 0,10 Q 0,0 10,0 H 130 Q 140,0 140,10 V 35 C 165,30 165,80 140,75 V 100 Q 140,110 130,110 H 10 Q 0,110 0,100 Z';
export const PUZZLE_PATH_RIGHT = 'M 20,10 Q 20,0 30,0 H 190 Q 200,0 200,10 V 100 Q 200,110 190,110 H 30 Q 20,110 20,100 V 75 C 45,80 45,30 20,35 Z';
