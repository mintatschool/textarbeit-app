
export const Tense = {
    PRAESENS: 'Präsens',
    PRAETERITUM: 'Präteritum',
    PERFEKT: 'Perfekt',
    PLUSQUAMPERFEKT: 'Plusquamperfekt',
    FUTUR_I: 'Futur I'
};

export const VERB_PRONOUNS = [
    { key: 'ich', label: 'ich' },
    { key: 'du', label: 'du' },
    { key: 'er_sie_es', label: 'er/sie/es' },
    { key: 'wir', label: 'wir' },
    { key: 'ihr', label: 'ihr' },
    { key: 'sie_Sie', label: 'sie' },
];

export const isCompoundTense = (tense) => {
    return [Tense.PERFEKT, Tense.PLUSQUAMPERFEKT, Tense.FUTUR_I].includes(tense);
};

export const getVerbPuzzleParts = (conjugated, tense) => {
    conjugated = conjugated.trim().toLowerCase();

    if (isCompoundTense(tense)) {
        const spaceIndex = conjugated.indexOf(' ');
        if (spaceIndex > -1) {
            const aux = conjugated.substring(0, spaceIndex);
            const part = conjugated.substring(spaceIndex + 1);
            return { fixedBefore: '', target: aux, fixedAfter: part };
        }
    }

    // Endungen für Verben (Präsens und Präteritum)
    const vSuffixes = ['test', 'tet', 'est', 'ten', 'en', 'st', 'te', 'et', 'e', 't', 'n'];
    vSuffixes.sort((a, b) => b.length - a.length);

    for (const suffix of vSuffixes) {
        if (conjugated.endsWith(suffix)) {
            const stem = conjugated.slice(0, -suffix.length);

            // Spezielle Logik für Präteritum (starke Verben schützen)
            if (tense === Tense.PRAETERITUM) {
                // Regelmäßige Schwache Präteritum-Endungen (te, test...) immer trennen
                if (['te', 'test', 'ten', 'tet'].includes(suffix)) {
                    return { fixedBefore: stem, target: suffix, fixedAfter: '' };
                }
                // Bei starken Verben (ging-st, ging-en, ging-t) nur trennen, wenn der Stamm stabil bleibt
                if (['en', 'st', 't'].includes(suffix) && stem.length >= 3) {
                    return { fixedBefore: stem, target: suffix, fixedAfter: '' };
                }
                // Sonst (z.B. "ging"): Nicht trennen, sondern als Ganzes anzeigen
                continue;
            }

            // Im Präsens ist die Trennung meist unkritisch (geh-en, lach-t)
            if (stem.length >= 2) {
                return { fixedBefore: stem, target: suffix, fixedAfter: '' };
            }
        }
    }

    // Fallback: Wenn keine Endung sinnvoll abgetrennt werden kann (z.B. "ging")
    return { fixedBefore: conjugated, target: '', fixedAfter: '' };
};

export const getInfinitiveStem = (lemma) => {
    if (!lemma) return { stem: '', ending: '' };
    const lower = lemma.toLowerCase();

    // Explicit exceptions for verbs where a split is confusing or doesn't follow standard patterns
    const EXCEPTIONS = ['sein', 'tun'];
    if (EXCEPTIONS.includes(lower)) {
        return { stem: lemma, ending: '' };
    }

    if (lower.endsWith('en')) {
        return { stem: lemma.slice(0, -2), ending: 'en' };
    }

    if (lower.endsWith('n') && !lower.endsWith('en')) {
        return { stem: lemma.slice(0, -1), ending: 'n' };
    }

    return { stem: lemma, ending: '' };
};
