
// Mock Dependencies
const text = "Der Fuchs.";
const processedWords = [
    { type: 'word', word: 'Der', index: 0, id: 'word_0' },
    { type: 'space', content: ' ' },
    { type: 'word', word: 'Fuchs', index: 4, id: 'word_4' },
    { type: 'text', content: '.' }
];

// Mock State
let textCorrections = {};
let hyphenator = true; // dummy

// Mock exerciseWords Logic
const getExerciseWords = () => {
    return processedWords.filter(w => w.type === 'word').map(w => {
        const lookupKey = `${w.word}_${w.index}`;
        if (textCorrections[lookupKey]) {
            const newText = textCorrections[lookupKey];
            return {
                ...w,
                word: newText,
                text: newText,
                syllables: [newText] // Mock syllables
            };
        }
        return w;
    });
};

// Mock onWordUpdate Logic
const onWordUpdate = (wordId, newText) => {
    const index = parseInt(wordId.replace('word_', ''), 10);
    const target = processedWords.find(w => w.index === index);

    if (!target) {
        console.log("Target not found!");
        return;
    }

    const lookupKey = `${target.word}_${target.index}`;
    console.log(`Updating ${lookupKey} to ${newText}`);
    textCorrections = { ...textCorrections, [lookupKey]: newText };
};

// SIMULATION
console.log("Initial State:");
console.log(getExerciseWords().map(w => w.word));

console.log("\n--- Action: Click 'Der' -> 'der' ---");
// WordListView calculates newText
const clickedWord = getExerciseWords()[0]; // "Der"
const firstChar = clickedWord.word.charAt(0);
const isUpper = firstChar === firstChar.toUpperCase();
const newText = (isUpper ? firstChar.toLowerCase() : firstChar.toUpperCase()) + clickedWord.word.slice(1);

console.log(`WordListView calculated newText: ${newText}`);
onWordUpdate(clickedWord.id, newText);

console.log("\nState after update:");
console.log(getExerciseWords().map(w => w.word));

console.log("\n--- Action: Click 'der' -> 'Der' ---");
const clickedWord2 = getExerciseWords()[0]; // "der"
const firstChar2 = clickedWord2.word.charAt(0);
const isUpper2 = firstChar2 === firstChar2.toUpperCase();
const newText2 = (isUpper2 ? firstChar2.toLowerCase() : firstChar2.toUpperCase()) + clickedWord2.word.slice(1);

console.log(`WordListView calculated newText: ${newText2}`);
onWordUpdate(clickedWord2.id, newText2);

console.log("\nState after second update:");
console.log(getExerciseWords().map(w => w.word));
