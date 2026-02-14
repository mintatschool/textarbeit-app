
const mockTense = {
    PRAESENS: 'Präsens',
    PRAETERITUM: 'Präteritum',
    PERFEKT: 'Perfekt',
    PLUSQUAMPERFEKT: 'Plusquamperfekt',
    FUTUR_I: 'Futur I'
};

const isCompoundTense = (tense) => {
    return [mockTense.PERFEKT, mockTense.PLUSQUAMPERFEKT, mockTense.FUTUR_I].includes(tense);
};

const getVerbPuzzlePartsMock = (conjugated, tense) => {
    conjugated = conjugated.trim().toLowerCase();

    // Check if it's a compound tense logic
    if (isCompoundTense(tense)) {
        console.log(`Debug: Processing compound tense '${tense}' for '${conjugated}'`);
        const spaceIndex = conjugated.indexOf(' ');
        if (spaceIndex > -1) {
            const aux = conjugated.substring(0, spaceIndex);
            const part = conjugated.substring(spaceIndex + 1);
            return { fixedBefore: '', target: aux, fixedAfter: part };
        } else {
            console.log(`Debug: No space found in compound tense string '${conjugated}'`);
        }
    }

    // Endungen für Verben (Präsens und Präteritum)
    const vSuffixes = ['test', 'tet', 'est', 'ten', 'en', 'st', 'te', 'et', 'e', 't', 'n'];
    vSuffixes.sort((a, b) => b.length - a.length);

    for (const suffix of vSuffixes) {
        if (conjugated.endsWith(suffix)) {
            const stem = conjugated.slice(0, -suffix.length);

            // Spezielle Logik für Präteritum (starke Verben schützen)
            if (tense === mockTense.PRAETERITUM) {
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

// Simulate DB entries for a regular verb
const createRegularVerb = (stem) => {
    return {
        [mockTense.PERFEKT]: { ich: `habe ge${stem}t`, du: `hast ge${stem}t` },
    };
};

// Test
const verbData = createRegularVerb('mach');
const tense = mockTense.PERFEKT;

console.log('Testing "machen" in Perfekt (Mocked):');
if (verbData[tense]) {
    Object.entries(verbData[tense]).forEach(([person, text]) => {
        const parts = getVerbPuzzlePartsMock(text, tense);
        console.log(`${person}: "${text}" -> `, parts);
    });
} else {
    console.log('No data for Perfekt');
}
