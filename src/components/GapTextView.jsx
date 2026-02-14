import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Word } from './Word';
import { Icons } from './Icons';
import { RewardModal } from './shared/RewardModal';
import { EmptyStateMessage } from './EmptyStateMessage';

import { usePointerDrag } from '../hooks/usePointerDrag';
// Removed polyfill import
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

export const GapTextView = ({ text, settings, setSettings, onClose, title, hyphenator }) => {
    const [sentences, setSentences] = useState([]);
    const [placedWords, setPlacedWords] = useState({}); // { gapId: wordObj }
    const [poolWords, setPoolWords] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null); // For Click-to-Place
    const dragItemRef = useRef(null);

    // iPad Fix: Prevent touch scrolling during drag
    // iPad Fix: Prevent touch scrolling during drag
    usePreventTouchScroll(isDragging);

    // Sentence Splitting Logic
    const splitSentences = (txt) => {
        return txt.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 1);
    };

    // Word Logic: find 3 longest words, pick one
    const processSentence = (sentence, sIdx) => {
        const wordsInSentence = sentence.split(/\s+/).filter(w => w.length > 0);

        // Capitalize the first word of the sentence
        if (wordsInSentence.length > 0) {
            const firstWord = wordsInSentence[0];
            firstWord.text = firstWord.text.charAt(0).toUpperCase() + firstWord.text.slice(1);
        }

        const cleanWords = wordsInSentence.map((w, i) => ({
            text: w,
            clean: w.replace(/[^\w\u00C0-\u017F]/g, ''),
            index: i
        })).filter(w => w.clean.length > 2); // Relaxed length

        if (cleanWords.length === 0) return { id: `s_${sIdx}`, parts: wordsInSentence.map(w => ({ type: 'text', text: w })) };

        // Scoring System
        const calculateScore = (wInfo, isStart) => {
            let score = 0;
            const { text, clean } = wInfo;
            if (clean.length > 5) score += 5;
            if (text[0] === text[0].toLowerCase() && clean.endsWith('en')) score += 10;
            if (text[0] === text[0].toUpperCase() && !isStart) score += 12;
            const articles = ['der', 'die', 'das', 'dem', 'den', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines', 'im', 'am', 'ins'];
            if (articles.includes(clean.toLowerCase())) score -= 20;
            return score;
        };

        const scoredWords = cleanWords.map(w => ({ ...w, score: calculateScore(w, w.index === 0) }));
        const maxScore = Math.max(...scoredWords.map(w => w.score));
        const candidates = scoredWords.filter(w => w.score === maxScore);
        const target = candidates[Math.floor(Math.random() * candidates.length)];

        const parts = [];
        wordsInSentence.forEach((w, i) => {
            if (i === target.index) {
                const trailingPunctuation = w.match(/[.,!?;:]+$/);
                if (trailingPunctuation) {
                    const cleanWord = w.substring(0, w.length - trailingPunctuation[0].length);
                    parts.push({ type: 'gap', id: `gap_${sIdx}`, correctText: cleanWord, cleanText: target.clean });
                    parts.push({ type: 'text', text: trailingPunctuation[0] });
                } else {
                    parts.push({ type: 'gap', id: `gap_${sIdx}`, correctText: w, cleanText: target.clean });
                }
            } else {
                parts.push({ type: 'text', text: w });
            }
        });

        const targetCleanWord = target.text.replace(/[.,!?;:]+$/, '');

        return {
            id: `s_${sIdx}`,
            parts,
            target: {
                ...target,
                text: targetCleanWord, // Clean word for pool card
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

    const handlePointerDrop = (dragItem, targetId) => {
        // dragItem: { word, source, gapId }
        // targetId: 'gap_S_I' or 'gap_S'?, 'pool', 'background'

        const { word, source, gapId } = dragItem;

        if (targetId === 'background' || targetId === 'pool') {
            if (source === 'gap' && gapId) {
                setPlacedWords(prev => {
                    const next = { ...prev };
                    delete next[gapId];
                    return next;
                });
                setPoolWords(prev => [...prev, word]);
            }
        } else if (targetId && targetId.startsWith('gap_')) {
            const targetGapId = targetId; // gap_S_I or gap_S

            const existingWord = placedWords[targetGapId];

            setPlacedWords(prev => {
                const next = { ...prev };
                next[targetGapId] = word;
                if (source === 'gap' && gapId) delete next[gapId];
                return next;
            });

            setPoolWords(prev => {
                let next = prev;
                if (source === 'pool') next = next.filter(w => w.poolId !== word.poolId);
                if (existingWord) next = [...next, existingWord];
                return next;
            });
        }
    };

    const { getDragProps, registerDropZone, dragState, hoveredZoneId, isDragging: isPointerDragging } = usePointerDrag({
        onDrop: handlePointerDrop
    });

    // Old handlers removed (handleDragStart, handleDragEnd, handleDrop, handlePoolDrop)

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
        return <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col modal-animate font-sans select-none">
            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alles richtig ergänzt! Super!"
            />

            {/* Header */}
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Icons.GapText className="text-blue-600" /> {title || "Lückentext"}
                </h2>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="48" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Scrollable Text Area */}
                <div
                    className="flex-1 overflow-y-auto custom-scroll p-12 bg-slate-50/50"
                    ref={registerDropZone('background')}
                >
                    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
                        <div className="flex flex-wrap items-baseline leading-relaxed" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily, columnGap: `${(settings.wordSpacing ?? 0.5)}em`, rowGap: '1.5em' }}>
                            {sentences.flatMap((sentence, sIdx) => [
                                ...sentence.parts.map((p, i) => {
                                    if (p.type === 'text') {
                                        return p.text.split(/(\s+)/).map((seg, sidx) => {
                                            if (seg.trim().length === 0) return null;
                                            return (
                                                <Word
                                                    key={`text_${sIdx}_${i}_${sidx}`}
                                                    word={seg}
                                                    startIndex={0}
                                                    settings={settings}
                                                    hyphenator={hyphenator}
                                                    isReadingMode={true}
                                                    forceShowSyllables={true}
                                                />
                                            );
                                        });
                                    }
                                    const placed = placedWords[p.id];
                                    return (
                                        <div
                                            key={`gap_${sIdx}_${i}`}
                                            ref={registerDropZone(p.id)}
                                            onClick={() => handleGapClick(p.id, p.correctText)}
                                            className={`relative inline-flex items-center justify-center min-w-[5em] h-[1.4em] border-b-2 transition-all rounded px-2 mx-1 cursor-pointer ${placed ? 'border-transparent' : 'border-slate-300 bg-slate-100/30'} ${selectedWord ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''} ${hoveredZoneId === p.id ? 'bg-blue-100/50 ring-2 ring-blue-200' : ''}`}
                                        >
                                            {placed ? (
                                                <div
                                                    {...getDragProps({ word: placed, source: 'gap', gapId: p.id }, p.id)}
                                                    className={`px-1 py-0 rounded font-bold cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] whitespace-nowrap leading-none select-none ${placed.color} ${isPointerDragging && dragState?.sourceId === p.id ? 'opacity-40' : ''}`}
                                                    style={{ fontSize: '1.2em', touchAction: 'none' }}
                                                >
                                                    <Word
                                                        word={placed.text}
                                                        startIndex={0}
                                                        settings={settings}
                                                        hyphenator={hyphenator}
                                                        isReadingMode={true}
                                                        forceNoMargin={true}
                                                        forceShowSyllables={true}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="opacity-0">{p.correctText}</span>
                                            )}
                                        </div>
                                    );
                                }),
                                sIdx < sentences.length - 1 && <span key={`space_${sIdx}`} className="mr-2"> </span>
                            ])}
                        </div>
                    </div>
                </div>

                {/* Fixed Sidebar for Word Pool */}
                <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20" ref={registerDropZone('pool')}>
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wortauswahl</span>
                        <p className="text-[10px] text-slate-500 mt-1">Ziehe die Wörter in den Text</p>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-4"
                    >
                        {poolWords.map((w) => (
                            <div
                                key={w.poolId}
                                {...getDragProps({ word: w, source: 'pool' }, w.poolId)}
                                onClick={() => handlePoolWordClick(w)}
                                className={`w-full p-5 font-bold rounded-2xl transition-all flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-[1.02] draggable-piece border-b-4 border-black/5 select-none ${w.color} ${selectedWord?.poolId === w.poolId ? 'selected-piece ring-4 ring-blue-500 shadow-xl z-50 scale-105' : 'shadow-md shadow-black/5 hover:shadow-lg'} ${isPointerDragging && dragState?.sourceId === w.poolId ? 'opacity-40' : ''}`}
                                style={{ fontFamily: settings.fontFamily, fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`, touchAction: 'none' }}
                            >
                                <Word
                                    word={w.text}
                                    startIndex={0}
                                    settings={settings}
                                    hyphenator={hyphenator}
                                    isReadingMode={true}
                                    forceNoMargin={true}
                                    forceShowSyllables={true}
                                />
                            </div>
                        ))}
                        {poolWords.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-300 gap-4 opacity-50">
                                <Icons.Check size={48} className="text-green-400" />
                                <span className="text-sm font-bold">Alles verteilt!</span>
                            </div>
                        )}
                    </div>
                </div >

                {/* Floating Drag Overlay */}
                {dragState && (
                    <div
                        className="fixed z-[10000] pointer-events-none"
                        style={{
                            left: dragState.pos.x - dragState.offset.x,
                            top: dragState.pos.y - dragState.offset.y,
                            width: dragState.cloneRect.width,
                            height: dragState.cloneRect.height,
                            transform: 'scale(1.03) rotate(1deg)',
                            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.20))'
                        }}
                    >
                        <div
                            className={`w-full h-full font-bold rounded-2xl flex items-center justify-center bg-white shadow-xl border border-blue-600 text-slate-800`}
                            style={{
                                fontFamily: settings.fontFamily,
                                fontSize: dragState.cloneStyle?.fontSize || (settings.fontSize + 'px')
                            }}
                        >
                            <Word
                                word={dragState.item.word.text}
                                startIndex={0}
                                settings={settings}
                                hyphenator={hyphenator}
                                isReadingMode={true}
                                forceNoMargin={true}
                                forceShowSyllables={true}
                            />
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
};
