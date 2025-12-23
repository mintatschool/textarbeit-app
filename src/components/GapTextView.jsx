import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

// Pastel colors for words
const WORD_COLORS = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-700',
    'bg-lime-100 text-lime-700',
    'bg-green-100 text-green-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-purple-100 text-purple-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700',
    'bg-rose-100 text-rose-700'
];

export const GapTextView = ({ text, settings, setSettings, onClose }) => {
    const [sentences, setSentences] = useState([]);
    const [placedWords, setPlacedWords] = useState({}); // { gapId: wordObj }
    const [poolWords, setPoolWords] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null); // For Click-to-Place
    const dragItemRef = useRef(null);

    // iPad Fix: Prevent touch scrolling during drag
    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('touchmove', preventDefault);
        };
    }, [isDragging]);

    // Sentence Splitting Logic
    const splitSentences = (txt) => {
        return txt.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
    };

    // Word Logic: find 3 longest words, pick one
    const processSentence = (sentence, sIdx) => {
        const wordsInSentence = sentence.split(/\s+/).filter(w => w.length > 0);
        const cleanWords = wordsInSentence.map((w, i) => ({
            text: w,
            clean: w.replace(/[^\w\u00C0-\u017F]/g, ''),
            index: i
        })).filter(w => w.clean.length > 3); // Must be longer than 3 chars

        if (cleanWords.length === 0) return { id: `s_${sIdx}`, parts: wordsInSentence.map(w => ({ type: 'text', text: w })) };

        const sorted = [...cleanWords].sort((a, b) => b.clean.length - a.clean.length);
        const top3 = sorted.slice(0, 3);
        const target = top3[Math.floor(Math.random() * top3.length)];

        const parts = wordsInSentence.map((w, i) => {
            if (i === target.index) {
                return { type: 'gap', id: `gap_${sIdx}`, correctText: target.text, cleanText: target.clean };
            }
            return { type: 'text', text: w };
        });

        return {
            id: `s_${sIdx}`,
            parts,
            target: {
                ...target,
                id: `gap_${sIdx}`,
                color: WORD_COLORS[sIdx % WORD_COLORS.length]
            }
        };
    };

    useEffect(() => {
        if (!text) return;
        const rawSentences = splitSentences(text);
        const processed = rawSentences.map((s, i) => processSentence(s, i));
        setSentences(processed);

        const targets = processed
            .filter(s => s.target)
            .map(s => ({ ...s.target, poolId: `pool_${s.target.id}` }))
            .sort(() => Math.random() - 0.5);

        setPoolWords(targets);
        setPlacedWords({});
    }, [text]);

    const handleDragStart = (e, word, source, gapId = null) => {
        setIsDragging(true);
        dragItemRef.current = { word, source, gapId };
        e.dataTransfer.setData('application/json', JSON.stringify(word));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        dragItemRef.current = null;
    };

    const handleDrop = (e, targetGapId, targetWord) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData) return;

        const cleanDragged = dragData.word.text.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();
        const cleanTarget = targetWord.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();

        if (cleanDragged !== cleanTarget) return;

        const existingWord = placedWords[targetGapId];

        setPlacedWords(prev => {
            const next = { ...prev };
            next[targetGapId] = dragData.word;
            if (dragData.source === 'gap' && dragData.gapId) delete next[dragData.gapId];
            return next;
        });

        setPoolWords(prev => {
            let next = prev;
            if (dragData.source === 'pool') next = next.filter(w => w.poolId !== dragData.word.poolId);
            if (existingWord) next = [...next, existingWord];
            return next;
        });
    };

    const handlePoolDrop = (e) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.source !== 'gap') return;
        setPlacedWords(prev => { const next = { ...prev }; delete next[dragData.gapId]; return next; });
        setPoolWords(prev => [...prev, dragData.word]);
    };

    // Click-to-Place Handlers
    const handlePoolWordClick = (word) => {
        if (selectedWord?.poolId === word.poolId) {
            setSelectedWord(null);
        } else {
            setSelectedWord(word);
        }
    };

    const handleGapClick = (gapId, correctText) => {
        if (!selectedWord) {
            // If already filled, return to pool on click
            if (placedWords[gapId]) {
                const word = placedWords[gapId];
                setPlacedWords(prev => { const next = { ...prev }; delete next[gapId]; return next; });
                setPoolWords(prev => [...prev, word]);
            }
            return;
        }

        const cleanSelected = selectedWord.text.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();
        const cleanTarget = correctText.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();

        if (cleanSelected === cleanTarget) {
            const wordToPlace = selectedWord;
            const existingWord = placedWords[gapId];

            setPlacedWords(prev => ({ ...prev, [gapId]: wordToPlace }));
            setPoolWords(prev => {
                let next = prev.filter(w => w.poolId !== wordToPlace.poolId);
                if (existingWord) next = [...next, existingWord];
                return next;
            });
            setSelectedWord(null);
        } else {
            setSelectedWord(null);
        }
    };

    useEffect(() => {
        const totalGaps = sentences.filter(s => s.target).length;
        if (totalGaps > 0 && Object.keys(placedWords).length === totalGaps) {
            setTimeout(() => setShowReward(true), 500);
        }
    }, [placedWords, sentences]);

    if (!text || sentences.length === 0) {
        return <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col modal-animate font-sans select-none">
            {showReward && (
                <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur rounded-2xl p-10 shadow-2xl pop-animate pointer-events-auto text-center border-4 border-yellow-400">
                        <h2 className="text-4xl font-bold text-slate-800 mb-4">Großartig! 🎉</h2>
                        <p className="text-xl text-slate-600 mb-6">Du hast den gesamten Text vervollständigt.</p>
                        <button onClick={onClose} className="px-10 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-lg min-touch-target">
                            Fertig
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Icons.GapText className="text-blue-600" /> Lückentext
                </h2>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="48" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 rounded-full w-12 h-12 transition-all flex items-center justify-center min-touch-target"><Icons.X size={28} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Scrollable Text Area */}
                <div className="flex-1 overflow-y-auto custom-scroll p-12 bg-slate-50/50">
                    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-4" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily, lineHeight: settings.lineHeight }}>
                            {sentences.map((s, sIdx) => (
                                <span key={s.id} className="inline flex-wrap items-baseline">
                                    {s.parts.map((p, pIdx) => {
                                        if (p.type === 'text') return <span key={pIdx}>{p.text} </span>;
                                        const placed = placedWords[p.id];
                                        return (
                                            <span
                                                key={pIdx}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50', 'border-blue-400'); }}
                                                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400'); }}
                                                onDrop={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400'); handleDrop(e, p.id, p.correctText); }}
                                                onClick={() => handleGapClick(p.id, p.correctText)}
                                                className={`relative inline-flex items-center justify-center min-w-[5em] h-[1.4em] border-b-2 transition-all rounded px-2 mx-1 cursor-pointer ${placed ? 'border-transparent' : 'border-slate-300 bg-slate-100/30'} ${selectedWord ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''}`}
                                            >
                                                {placed ? (
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, placed, 'gap', p.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`px-1 py-0 rounded font-bold cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] whitespace-nowrap leading-none touch-action-none touch-manipulation select-none ${placed.color}`}
                                                        style={{ fontSize: '1.2em' }}
                                                    >
                                                        {placed.text}
                                                    </div>
                                                ) : (
                                                    <span className="opacity-0">{p.correctText}</span>
                                                )}
                                            </span>
                                        );
                                    })}
                                    {sIdx < sentences.length - 1 && <span className="mr-2"> </span>}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fixed Sidebar for Word Pool */}
                <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wortauswahl</span>
                        <p className="text-[10px] text-slate-500 mt-1">Ziehe die Wörter in den Text</p>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-4"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handlePoolDrop}
                    >
                        {poolWords.map((w) => (
                            <div
                                key={w.poolId}
                                draggable
                                onDragStart={(e) => handleDragStart(e, w, 'pool')}
                                onDragEnd={handleDragEnd}
                                onClick={() => handlePoolWordClick(w)}
                                className={`w-full p-4 font-bold rounded-2xl transition-all flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-[1.02] touch-action-none touch-manipulation select-none ${w.color} ${selectedWord?.poolId === w.poolId ? 'ring-4 ring-blue-500 shadow-xl scale-105' : 'shadow-sm'}`}
                                style={{ fontFamily: settings.fontFamily, fontSize: `${Math.max(20, settings.fontSize * 0.8)}px` }}
                            >
                                {w.text}
                            </div>
                        ))}
                        {poolWords.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-300 gap-4 opacity-50">
                                <Icons.Check size={48} className="text-green-400" />
                                <span className="text-sm font-bold">Alles verteilt!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
