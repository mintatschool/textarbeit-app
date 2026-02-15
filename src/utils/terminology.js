
export const DEFAULT_TERM_REPLACEMENTS = [
    { technical: "Vokale", simple: "Selbstlaute" },
    { technical: "Konsonanten", simple: "Mitlaute" },
    { technical: "Substantive", simple: "Namenwörter" },
    { technical: "Verben", simple: "Tunwörter" },
    { technical: "Adjektive", simple: "Wiewörter" }
];

/**
 * Returns the appropriate term based on settings.
 * @param {string} term - The technical term to potentially replace (e.g., "Substantive").
 * @param {object} settings - The application settings object.
 * @returns {string} The replaced term or the original term.
 */
export const getTerm = (term, settings) => {
    if (!settings || !settings.replaceTechnicalTerms) {
        return term;
    }

    const replacements = settings.termReplacements || DEFAULT_TERM_REPLACEMENTS;
    const found = replacements.find(r => r.technical.toLowerCase() === term.toLowerCase());

    // Case preservation (simple heuristic: if original is capitalized, capitalize result)
    if (found) {
        const result = found.simple;
        if (term[0] === term[0].toUpperCase()) {
            return result.charAt(0).toUpperCase() + result.slice(1);
        }
        return result.toLowerCase();
    }

    return term;
};
