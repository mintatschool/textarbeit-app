
import { analyzeTextLocalNouns } from '../data/nounDatabase';
import { findVerbLemma } from '../data/verbDatabase';
import { findAdjectiveLemma } from '../data/adjectiveDatabase';
import { OTHER_WORDS_DB } from '../data/otherDatabase';
import { PRONOUN_DB } from '../data/pronounDatabase';

/**
 * Returns the correct casing for a German word based on its presence in word databases.
 * @param {string} word - The word to check.
 * @returns {string} - The word with correct capitalization.
 */
export const getCorrectCasing = (word) => {
    if (!word) return word;
    const cleanWord = word.trim();
    if (cleanWord.length === 0) return word;

    const lower = cleanWord.toLowerCase();

    // 1. Check if it's a Noun (Always Capitalized)
    const nouns = analyzeTextLocalNouns(lower);
    if (nouns.length > 0) {
        // If it's found as a noun, we capitalize it.
        // Even if it's also a verb (e.g., 'laufen' vs 'Laufen'), 
        // usually the capitalized form is the 'more correct' isolated form if it exists as a noun.
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    // 2. Check if it's a Verb
    if (findVerbLemma(lower)) {
        return lower;
    }

    // 3. Check if it's an Adjective
    if (findAdjectiveLemma(lower)) {
        return lower;
    }

    // 4. Check if it's in the Pronoun database
    const pronounMatch = PRONOUN_DB.find(p => p.word.toLowerCase() === lower);
    if (pronounMatch) {
        return pronounMatch.word; // Return exactly as stored in DB
    }

    // 5. Check if it's in the Other database
    const otherMatch = OTHER_WORDS_DB.find(o => o.word.toLowerCase() === lower);
    if (otherMatch) {
        return otherMatch.word; // Return exactly as stored in DB
    }

    // 5. Fallback: Return as is
    return word;
};
