
// Standard-Bausteine für Puzzle-Modus (Suffixes)
const DEFAULT_SUFFIXES = [
    'chen', 'lein', 'ung', 'keit', 'heit', 'nis', 'schaft', 'tum', 'ling', 
    'en', 'ern', 'er', 'sten', 'ste', 'es', 'em', 
    'sch', 'ch', 'pf', 'ck', 'tz', 'ng', 'nk', 'ph', 'qu', 'st', 'sp', 
    'ie', 'ee', 'aa', 'oo', 'ei', 'eu', 'au', 'äu',
    'ig', 'lich', 'isch', 'haft', 'bar', 'sam', 'los'
];

// Defaults für die neuen Rubriken
const DEFAULT_PREFIXES = [
    'ver', 'be', 'ge', 'er', 'zer', 'ent', 'emp', 'miss', 
    'auf', 'ab', 'an', 'aus', 'bei', 'ein', 'los', 'mit', 'nach', 
    'her', 'hin', 'vor', 'weg', 'zu', 'un', 'um', 'dar', 'fort'
];

const DEFAULT_VOWELS = [
    'ie', 'ei', 'au', 'eu', 'äu', 'aa', 'ee', 'oo'
];

const DEFAULT_CONSONANTS = [
    'ch', 'sch', 'ck', 'tz', 'pf', 'sp', 'st', 'qu', 'ph', 'ng', 'nk'
];

// Keys für LocalStorage
const STORAGE_KEY_SUFFIXES = 'wortarten_suffixes';
const STORAGE_KEY_PREFIXES = 'wortarten_prefixes';
const STORAGE_KEY_VOWELS = 'wortarten_vowels';
const STORAGE_KEY_CONSONANTS = 'wortarten_consonants';
const STORAGE_KEY_OVERRIDES = 'wortarten_split_overrides';

// Typ für manuelle Trennungen: "hilft" -> "hi" (Rest wird automatisch berechnet)
export type SplitOverrides = Record<string, string>;

// --- Helper Generic Storage ---
const getList = (key: string, defaults: string[]): string[] => {
    try {
        const stored = localStorage.getItem(key);
        const list = stored ? JSON.parse(stored) : defaults;
        // Grundsätzlich alphabetisch sortiert zurückgeben
        return [...list].sort((a: string, b: string) => a.localeCompare(b));
    } catch {
        return [...defaults].sort((a: string, b: string) => a.localeCompare(b));
    }
};

const saveList = (key: string, list: string[]) => {
    // Sortieren alphabetisch
    const sorted = [...list].sort((a, b) => a.localeCompare(b));
    localStorage.setItem(key, JSON.stringify(sorted));
};

const resetList = (key: string) => {
    localStorage.removeItem(key);
};

// --- Exports Suffixes ---
export const getStoredSuffixes = () => getList(STORAGE_KEY_SUFFIXES, DEFAULT_SUFFIXES);
export const saveSuffixes = (list: string[]) => saveList(STORAGE_KEY_SUFFIXES, list);
export const resetSuffixes = () => resetList(STORAGE_KEY_SUFFIXES);

// --- Exports Prefixes ---
export const getStoredPrefixes = () => getList(STORAGE_KEY_PREFIXES, DEFAULT_PREFIXES);
export const savePrefixes = (list: string[]) => saveList(STORAGE_KEY_PREFIXES, list);
export const resetPrefixes = () => resetList(STORAGE_KEY_PREFIXES);

// --- Exports Vowels ---
export const getStoredVowels = () => getList(STORAGE_KEY_VOWELS, DEFAULT_VOWELS);
export const saveVowels = (list: string[]) => saveList(STORAGE_KEY_VOWELS, list);
export const resetVowels = () => resetList(STORAGE_KEY_VOWELS);

// --- Exports Consonants ---
export const getStoredConsonants = () => getList(STORAGE_KEY_CONSONANTS, DEFAULT_CONSONANTS);
export const saveConsonants = (list: string[]) => saveList(STORAGE_KEY_CONSONANTS, list);
export const resetConsonants = () => resetList(STORAGE_KEY_CONSONANTS);

// --- Overrides ---
export const getStoredOverrides = (): SplitOverrides => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_OVERRIDES);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

export const saveOverride = (word: string, prefix: string) => {
    const overrides = getStoredOverrides();
    overrides[word.toLowerCase().trim()] = prefix.toLowerCase().trim();
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
};

export const removeOverride = (word: string) => {
    const overrides = getStoredOverrides();
    delete overrides[word.toLowerCase().trim()];
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
};

// --- ZENTRALE LOGIK ---

export const calculateExtensionSplit = (word: string): { start: string, end: string } => {
    const w = word.trim();
    const wLower = w.toLowerCase();
    
    // 1. Check Overrides (Manuelle Ausnahmen)
    const overrides = getStoredOverrides();
    if (overrides[wLower]) {
        const prefix = overrides[wLower];
        // Sicherstellen, dass das Prefix auch wirklich am Anfang steht
        if (wLower.startsWith(prefix)) {
            return { 
                start: w.substring(0, prefix.length), // Case preservation aus Original
                end: w.substring(prefix.length) 
            };
        }
    }

    // 2. Konfigurierbare Vorsilben prüfen
    const prefixes = getStoredPrefixes();
    // WICHTIG: Für Matching müssen wir nach Länge sortieren (längste zuerst, z.B. "zurück" vor "zu")
    // Da getStoredPrefixes jetzt alphabetisch liefert, müssen wir hier zwingend sortieren.
    prefixes.sort((a,b) => b.length - a.length);

    for (const p of prefixes) {
        if (wLower.startsWith(p)) {
             // LOGIK ÄNDERUNG: Vorsilbe + nachfolgender Buchstabe/Verbindung
             const remainder = w.slice(p.length);
             if (remainder.length === 0) return { start: w, end: '' };

             // Wir suchen den nächsten "Block". 
             // Wenn es mit Konsonanten beginnt, nehmen wir alle Konsonanten bis zum ersten Vokal.
             // Wenn es mit Vokalen beginnt (eher selten nach Vorsilben bei deutschen Stammwörtern, aber möglich wie 'beachten'), nehmen wir die Vokale.
             
             // Regex für Konsonanten am Anfang des Rests (nicht a,e,i,o,u,ä,ö,ü)
             const consonantMatch = remainder.match(/^[^aeiouäöüAEIOUÄÖÜ]+/);
             
             let extraPart = '';
             if (consonantMatch) {
                 extraPart = consonantMatch[0];
             } else {
                 // Fallback: Wenn es mit Vokal beginnt, nimm den Vokal (oder Vokalverbindung)
                 const vowelMatch = remainder.match(/^[aeiouäöüAEIOUÄÖÜ]+/);
                 extraPart = vowelMatch ? vowelMatch[0] : remainder.charAt(0);
             }

             const splitPoint = p.length + extraPart.length;
             return { start: w.slice(0, splitPoint), end: w.slice(splitPoint) };
        }
    }

    // 3. Automatische Logik (Konsonant(en) + Vokal(e)) wenn keine Vorsilbe
    // Regex Erklärung:
    // ^                   : Start des Wortes
    // [^aeiouäöü...]*     : 0 oder mehr Konsonanten (alles was kein Vokal ist)
    // [aeiouäöüAEIOUÄÖÜ]+ : 1 oder mehr Vokale (Vokalverbindung)
    
    const match = w.match(/^([^aeiouäöüAEIOUÄÖÜ]*[aeiouäöüAEIOUÄÖÜ]+)(.*)/i);
    
    if (match) {
        return { start: match[1], end: match[2] };
    }
    
    // Fallback: 1. Buchstabe, falls gar nichts passt
    return { start: w.charAt(0), end: w.slice(1) };
};

export const calculatePuzzleSplit = (word: string, isAdjectivePositiv = false): { fixedBefore: string, target: string, fixedAfter: string } => {
    const w = word.trim();
    if (w.length < 2) return { fixedBefore: '', target: w, fixedAfter: '' };

    // 1. Hole konfigurierte Endungen (Suffixes)
    const suffixes = getStoredSuffixes();
    // WICHTIG: Für Matching müssen wir nach Länge sortieren (längste zuerst, z.B. "schaft" vor "aft")
    suffixes.sort((a,b) => b.length - a.length);

    for (const suffix of suffixes) {
        if (w.endsWith(suffix)) {
             return { fixedBefore: w.slice(0, -suffix.length), target: suffix, fixedAfter: '' };
        }
    }
    
    // Fallback Logik wenn keine Endung passt
    if (w.endsWith('e')) return { fixedBefore: w.slice(0, -1), target: 'e', fixedAfter: '' };
    
    const lastChar = w.slice(-1);
    const isVowel = ['a','e','i','o','u','ä','ö','ü'].includes(lastChar.toLowerCase());
    
    // Wenn Konsonant am Ende, nimm diesen
    if (!isVowel) return { fixedBefore: w.slice(0, -1), target: lastChar, fixedAfter: '' };

    return { fixedBefore: '', target: w, fixedAfter: '' };
};
