import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';

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

export const StaircaseView = ({ words, settings, setSettings, onClose, title }) => {
    // Filter to only highlighted words
    const highlightedWords = useMemo(() => {
        return words.filter(w => w.isHighlighted);
    }, [words]);

    const [currentIndex, setCurrentIndex] = useState(0);

    if (!words || words.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
                <EmptyStateMessage onClose={onClose} />
            </div>
        );
    }

    if (highlightedWords.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md mx-4">
                        <Icons.Stairs size={64} className="mx-auto text-indigo-300 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Keine Wörter markiert</h2>
                        <p className="text-slate-600 mb-6">
                            Bitte markiere zuerst Wörter im Text, um sie als Treppenwörter anzuzeigen.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition min-touch-target"
                        >
                            Zurück
                        </button>
                    </div>
                </div>
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
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Stairs className="text-blue-600" /> {title || "Treppenwörter"}
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
                        {currentIndex + 1} / {highlightedWords.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="32"
                            max="120"
                            value={settings.fontSize}
                            onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"
                    >
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-2 bg-white border-b border-slate-200">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50 overflow-y-auto custom-scroll">
                <div className="mb-8">
                    <button
                        onClick={() => speak(currentWord.word)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0"
                        title="Wort anhören"
                    >
                        <Icons.Volume2 size={24} />
                    </button>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                    <div className="flex flex-col items-start gap-1">
                        {staircaseLines.map((line, idx) => (
                            <div
                                key={idx}
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
                        ))}
                    </div>

                    {/* Full word display */}
                    <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                        <span
                            className="text-blue-600 font-bold"
                            style={{
                                fontFamily: settings.fontFamily,
                                fontSize: `${settings.fontSize * 1.2}px`,
                                letterSpacing: '0.15em'
                            }}
                        >
                            {currentWord.word}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-6 bg-white border-t border-slate-200 flex justify-center gap-4">
                <button
                    onClick={prevWord}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-touch-target"
                >
                    <Icons.ArrowRight size={20} className="rotate-180" /> Zurück
                </button>
                <button
                    onClick={nextWord}
                    disabled={currentIndex === highlightedWords.length - 1}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-touch-target"
                >
                    Weiter <Icons.ArrowRight size={20} />
                </button>
            </div>
        </div >
    );
};
