import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';

export const CaseExerciseView = ({ text, settings, setSettings, onClose, title }) => {
    const [wordStates, setWordStates] = useState({}); // idx -> 'UPPER' | 'STANDARD' | 'LOWER'
    const [showReward, setShowReward] = useState(false);
    const [checkResults, setCheckResults] = useState(null); // { correctIndices: Set, allCorrect: bool }
    const [isShaking, setIsShaking] = useState(false);

    // Split text into words and other segments
    const segments = useMemo(() => {
        if (!text) return [];
        // This splits by non-word characters but keeps them in the array
        const parts = text.split(/([^\w\u00C0-\u017F]+)/);
        let isAtSentenceStart = true;

        return parts.filter(p => p !== '').map((part, idx) => {
            const isWord = /[\w\u00C0-\u017F]+/.test(part);
            let content = part;

            if (isWord) {
                if (isAtSentenceStart && content.length > 0) {
                    content = content.charAt(0).toUpperCase() + content.slice(1);
                }
                isAtSentenceStart = false; // Next word is not at start until we see punctuation
            } else {
                // If it contains sentence-ending punctuation OR a newline, next word is at start
                if (/[.!?\n]/.test(part)) {
                    isAtSentenceStart = true;
                }
            }

            return {
                content,
                isWord,
                idx
            };
        });
    }, [text]);

    // Initialize all words to UPPER
    useEffect(() => {
        if (segments.length === 0) return;
        const initialStates = {};
        segments.forEach(seg => {
            if (seg.isWord) initialStates[seg.idx] = 'UPPER';
        });
        setWordStates(initialStates);
        setCheckResults(null);
        setShowReward(false);
        setIsShaking(false);
    }, [segments]);

    const getDisplayWord = (original, state) => {
        if (!original) return '';
        if (state === 'UPPER') return original.toUpperCase();
        if (state === 'LOWER') return original.toLowerCase();
        // STANDARD: First big, rest small
        return original[0].toUpperCase() + original.slice(1).toLowerCase();
    };

    const handleWordClick = (segIdx) => {
        setWordStates(prev => {
            const current = prev[segIdx];
            // UPPER -> LOWER
            // LOWER -> STANDARD
            // STANDARD -> LOWER
            let nextState = 'LOWER';
            if (current === 'LOWER') nextState = 'STANDARD';
            return { ...prev, [segIdx]: nextState };
        });
    };

    const handleCheck = () => {
        const correctIndices = new Set();
        let allCorrect = true;

        segments.forEach(seg => {
            if (seg.isWord) {
                const current = getDisplayWord(seg.content, wordStates[seg.idx]);
                // Compare with original text casing
                if (current === seg.content) {
                    correctIndices.add(seg.idx);
                } else {
                    allCorrect = false;
                }
            }
        });

        if (!allCorrect) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);

            // Reset incorrect words to UPPER
            setWordStates(prev => {
                const next = { ...prev };
                segments.forEach(seg => {
                    if (seg.isWord && !correctIndices.has(seg.idx)) {
                        next[seg.idx] = 'UPPER';
                    }
                });
                return next;
            });
        }

        setCheckResults({ correctIndices, allCorrect });
        if (allCorrect) {
            setTimeout(() => setShowReward(true), 500);
        }
    };



    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col modal-animate font-sans select-none">
            {showReward && (
                <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alles richtig korrigiert! Prima!
                            </span>
                            <button onClick={onClose} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg min-touch-target">
                                Beenden
                            </button>
                        </div>
                    </div>

                    {/* Confetti */}
                    <div className="fixed inset-0 pointer-events-none z-[160]">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="confetti" style={{
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 4)],
                                animationDuration: `${2 + Math.random() * 3}s`,
                                animationDelay: `${Math.random()}s`
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Icons.Capitalization className="text-blue-600" /> {title || "Groß- und Kleinschreibung"}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="24" max="100" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scroll p-4 md:p-8 flex flex-col items-center min-h-0 ${isShaking ? 'shake' : ''}`}>
                <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-12 md:p-16 mb-24 relative overflow-hidden min-h-[60vh]">
                    {/* Background indicator for success */}
                    {checkResults?.allCorrect && (
                        <div className="absolute inset-0 bg-green-50/50 pointer-events-none animate-fadeIn" />
                    )}

                    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-4 relative z-10" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily, lineHeight: 1.8 }}>
                        {segments.map((seg) => {
                            if (!seg.isWord) {
                                return <span key={seg.idx} className="text-slate-400 whitespace-pre-wrap">{seg.content}</span>;
                            }

                            const state = wordStates[seg.idx];
                            const display = getDisplayWord(seg.content, state);
                            const isCorrect = checkResults?.correctIndices.has(seg.idx);
                            const hasChecked = checkResults !== null;

                            return (
                                <span
                                    key={seg.idx}
                                    onClick={() => handleWordClick(seg.idx)}
                                    className={`inline-flex items-center rounded-xl transition-all duration-300 cursor-pointer px-1 ${hasChecked ? (isCorrect ? 'bg-green-100 text-green-900 border-green-200 ring-2 ring-green-400/20' : 'bg-slate-50 border-slate-200') : 'hover:bg-slate-50'}`}
                                >
                                    {display.split('').map((char, cIdx) => (
                                        <span
                                            key={cIdx}
                                            className={`px-px rounded-md transition-all font-bold ${cIdx === 0 ? 'text-blue-600' : 'text-slate-800'}`}
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Footer for Check Button */}
            </div>
            <div className="p-6 bg-white border-t border-slate-200 flex justify-center gap-4 shrink-0">
                <button
                    onClick={handleCheck}
                    disabled={checkResults?.allCorrect}
                    className={`px-12 py-4 rounded-xl font-bold text-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 min-touch-target ${checkResults?.allCorrect ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {checkResults?.allCorrect ? (
                        <><Icons.CheckCircle size={28} /> Alles richtig!</>
                    ) : (
                        <><Icons.CheckCircle size={28} /> Prüfen</>
                    )}
                </button>
            </div>
        </div>
    );
};
