import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';
import { ExerciseHeader } from './ExerciseHeader';

// German letter clusters that should not be split
const LETTER_CLUSTERS = [
    // Trigraphs
    'sch',
    // Digraphs consonants
    'ch', 'ck', 'pf', 'qu', 'ng', 'nk',
    // Double consonants
    'mm', 'nn', 'll', 'ss', 'tt', 'pp', 'ff', 'rr', 'bb', 'dd', 'gg', 'zz', 'ßß',
    // Vowel digraphs
    'ei', 'ie', 'eu', 'äu', 'au', 'ai', 'oi', 'aa', 'ee', 'oo',
    // Special
    'th', 'ph', 'rh',
];

// Split word into letter units (keeping clusters together)
const splitIntoUnits = (word) => {
    const units = [];
    let i = 0;
    const lowerWord = word.toLowerCase();

    while (i < word.length) {
        let matched = false;

        // Try to match longest cluster first (3 chars, then 2)
        for (let len = 3; len >= 2; len--) {
            if (i + len <= word.length) {
                const slice = lowerWord.slice(i, i + len);
                if (LETTER_CLUSTERS.includes(slice)) {
                    // Keep original case
                    units.push(word.slice(i, i + len));
                    i += len;
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            units.push(word[i]);
            i++;
        }
    }

    return units;
};

// Build staircase lines from units
const buildStaircase = (units) => {
    const lines = [];
    for (let i = 1; i <= units.length; i++) {
        lines.push(units.slice(0, i).join(''));
    }
    return lines;
};

import { shuffleArray } from '../utils/arrayUtils';

export const StaircaseView = ({ words, settings, setSettings, onClose, title }) => {
    // Filter to only highlighted words
    const highlightedWords = useMemo(() => {
        return shuffleArray(words.filter(w => w.isHighlighted));
    }, [words]);

    const [currentIndex, setCurrentIndex] = useState(0);

    if (!words || words.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
                <EmptyStateMessage onClose={onClose} />
            </div>
        );
    }

    if (highlightedWords.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
                <EmptyStateMessage onClose={onClose} />
            </div>
        );
    }

    const currentWord = highlightedWords[currentIndex];
    const units = splitIntoUnits(currentWord.word);
    const staircaseLines = buildStaircase(units);

    const nextWord = () => {
        if (currentIndex < highlightedWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevWord = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const progress = ((currentIndex + 1) / highlightedWords.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col modal-animate font-sans">
            <ExerciseHeader
                title={title || "Treppenwörter"}
                icon={Icons.Stairs}
                current={currentIndex + 1}
                total={highlightedWords.length}
                progressPercentage={progress}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={32}
                sliderMax={120}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scroll bg-white/50">
                <div className="min-h-full flex flex-col items-center justify-center p-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                        <div className="flex flex-col items-start gap-1">
                            {staircaseLines.map((line, idx) => (
                                <div key={idx} className="w-full flex justify-between items-center group">
                                    <div
                                        className="text-slate-800 font-bold transition-all duration-300 animate-[fadeInUp_0.3s_ease-out]"
                                        style={{
                                            fontFamily: settings.fontFamily,
                                            fontSize: `${settings.fontSize}px`,
                                            letterSpacing: '0.3em',
                                            animationDelay: `${idx * 0.05}s`,
                                            animationFillMode: 'backwards'
                                        }}
                                    >
                                        {line}
                                    </div>
                                    {idx === staircaseLines.length - 1 && (
                                        <button
                                            onClick={() => speak(currentWord.word)}
                                            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0"
                                            title="Wort anhören"
                                        >
                                            <Icons.Volume2 size={24} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={prevWord}
                    disabled={currentIndex === 0}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-touch-target"
                >
                    <Icons.ArrowRight size={20} className="rotate-180" /> Zurück
                </button>
                <button
                    onClick={nextWord}
                    disabled={currentIndex === highlightedWords.length - 1}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-touch-target"
                >
                    Weiter <Icons.ArrowRight size={20} />
                </button>
            </div>
        </div >
    );
};
