import React from 'react';
import { Icons } from './Icons';

const EXERCISE_HINTS = {
    // Buchstaben
    findLetters: {
        title: 'Buchstaben finden',
        icon: Icons.LetterSearch,
        requirements: [
            { text: 'Gib einen Text ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },

    // Silben
    syllableCarpet: {
        title: 'Silbenteppich',
        icon: Icons.Grid2x2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    syllableComposition: {
        title: 'Silbenbau 1',
        icon: Icons.Silbenbau1,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    syllableExtension: {
        title: 'Silbenbau 2',
        icon: Icons.Silbenbau2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },

    // Wörter
    staircase: {
        title: 'Treppenwörter',
        icon: Icons.Stairs,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    speedReading: {
        title: 'Blitzlesen',
        icon: Icons.Zap,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    wordSorting: {
        title: 'Wörter sortieren',
        icon: Icons.WordSorting,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    alphabetSorting: {
        title: 'Alphabetisch sortieren',
        icon: Icons.SortAsc,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    puzzleTestTwo: {
        title: 'Silbenpuzzle 1',
        icon: Icons.Silbenpuzzle1,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    puzzleTestMulti: {
        title: 'Silbenpuzzle 2',
        icon: Icons.Silbenpuzzle2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter mit mindestens 2 Silben markieren' }
        ]
    },
    initialSound: {
        title: 'Anfangsbuchstaben finden',
        icon: Icons.InitialSound,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    gapWords: {
        title: 'Lückenwörter',
        icon: Icons.GapWords,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    cloud: {
        title: 'Schüttelwörter',
        icon: Icons.Cloud,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },
    splitExercise: {
        title: 'Wörter trennen',
        icon: Icons.Scissors,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Wörter im Text markieren' }
        ]
    },

    // Wortarten
    wordSortingByParticiple: {
        title: 'Nach Wortart sortieren',
        icon: Icons.WordSorting,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Mindestens 2 verschiedene Wortarten markieren' },
            { text: '(z.B. Substantive und Verben)' }
        ]
    },
    nounWriting: {
        title: 'Substantive schreiben',
        icon: Icons.Edit2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Substantive mit Pluralformen im Text markieren' }
        ]
    },
    verbWriting: {
        title: 'Verben schreiben',
        icon: Icons.Edit2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Verben im Text markieren' }
        ]
    },
    adjectiveWriting: {
        title: 'Adjektive schreiben',
        icon: Icons.Edit2,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Adjektive im Text markieren' }
        ]
    },
    verbPuzzle: {
        title: 'Verben puzzlen',
        icon: Icons.VerbPuzzle,
        requirements: [
            { text: 'Grauen Kasten wählen' },
            { text: 'Verben im Text markieren' }
        ]
    },

    // Sätze
    sentenceShuffle: {
        title: 'Schüttelsätze',
        icon: Icons.Shuffle,
        requirements: [
            { text: 'Gib einen Text mit Sätzen ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },
    gapSentences: {
        title: 'Lückensätze',
        icon: Icons.GapSentences,
        requirements: [
            { text: 'Gib einen Text mit Sätzen ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },

    // Text
    sentencePuzzle: {
        title: 'Satzpuzzle',
        icon: Icons.Sentence,
        requirements: [
            { text: 'Gib einen Text mit Sätzen ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },
    textPuzzle: {
        title: 'Textpuzzle',
        icon: Icons.TextBlocks,
        requirements: [
            { text: 'Gib einen Text ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },
    caseExercise: {
        title: 'Groß-/Kleinschreibung',
        icon: Icons.Capitalization,
        requirements: [
            { text: 'Gib einen Text ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    },
    gapText: {
        title: 'Lückentext',
        icon: Icons.GapText,
        requirements: [
            { text: 'Gib einen Text ein' },
            { text: 'Klicke auf "Starten"' }
        ]
    }
};

export const ExerciseHintModal = ({ onClose, exerciseKey }) => {
    const hint = EXERCISE_HINTS[exerciseKey];

    if (!hint) {
        // Fallback for unknown exercises
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 max-w-lg w-full font-sans">
                <div className="text-center space-y-4 mb-10">
                    <div className="flex justify-center mb-6">
                        <Icons.SelectionHint size={160} className="text-slate-800" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        Bitte markiere zuerst Wörter im Text!
                    </h3>
                    <div className="flex flex-col items-start gap-4 text-slate-500 font-medium text-lg text-left">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold shrink-0">1</span>
                            <span className="flex-1">Grauen Kasten wählen</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold shrink-0">2</span>
                            <span className="flex-1">Wörter markieren</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                    Verstanden
                </button>
            </div>
        );
    }

    const IconComponent = hint.icon;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] shadow-xl border-2 border-slate-100 max-w-lg w-full font-sans">
            <div className="text-center space-y-4 mb-10">
                {IconComponent && (
                    <div className="flex justify-center mb-6">
                        <IconComponent size={160} className="text-slate-800" />
                    </div>
                )}
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {hint.title}
                </h3>

                <div className="flex flex-col items-start gap-4 text-slate-500 font-medium text-lg text-left w-full">
                    {hint.requirements.map((req, idx) => {
                        // Check if this is an optional/note step (starts with parenthesis)
                        if (req.text.startsWith('(')) {
                            return (
                                <div key={idx} className="flex items-center gap-3 opacity-50 w-full">
                                    <div className="w-8 h-8 shrink-0" /> {/* Spacer for number */}
                                    <span className="flex-1">{req.text}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className="flex items-center gap-4 w-full">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold shrink-0">
                                    {idx + 1}
                                </span>
                                <span className="flex-1">{req.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
                Verstanden
            </button>
        </div>
    );
};
