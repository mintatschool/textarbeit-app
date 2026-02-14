import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Word } from './Word';
import { Icons } from './Icons';
import { shuffleArray } from '../utils/arrayUtils';
import { Minus, Plus } from 'lucide-react';
import { EmptyStateMessage } from './EmptyStateMessage';
import { HorizontalLines } from './shared/UIComponents';
import { usePreventTouchScroll } from '../hooks/usePreventTouchScroll';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';

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

export const GapSentencesView = ({ text, highlightedIndices = new Set(), wordColors = {}, settings, setSettings, onClose, title, hyphenator }) => {
    const [mode, setMode] = useState('random'); // 'random' or 'marked'
    const [itemsPerStage, setItemsPerStage] = useState(5);
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedWords, setPlacedWords] = useState({}); // { gapId: wordObj }
    const [poolWords, setPoolWords] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null); // For Click-to-Place
    const [pendingItemsCount, setPendingItemsCount] = useState(5);
    const debounceTimerRef = useRef(null);

    // iPad Fix: Prevent touch scrolling during drag handled by hook

    // Sentence Splitting Logic
    const splitSentences = (txt) => {
        const sentences = txt.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 1);
        let lastIndex = 0;
        return sentences.map(s => {
            const index = txt.indexOf(s, lastIndex);
            lastIndex = index + s.length;
            return { text: s, startIndex: index };
        });
    };

    // Word Logic: find 3 longest words, pick one
    const processSentence = (sentenceObj, sIdx) => {
        const { text: sentence, startIndex: sentenceOffset } = sentenceObj;

        const wordsInSentence = [];
        let currentOffset = 0;
        sentence.split(/(\s+)/).forEach(seg => {
            if (seg.match(/^\s+$/)) {
                currentOffset += seg.length;
            } else if (seg.length > 0) {
                wordsInSentence.push({
                    text: seg,
                    offset: currentOffset,
                    globalIndex: sentenceOffset + currentOffset
                });
                currentOffset += seg.length;
            }
        });

        // Capitalize the first word of the sentence
        if (wordsInSentence.length > 0) {
            const firstWord = wordsInSentence[0];
            firstWord.text = firstWord.text.charAt(0).toUpperCase() + firstWord.text.slice(1);
        }

        const cleanWords = wordsInSentence.map((w, i) => {
            const clean = w.text.replace(/[^\w\u00C0-\u017F]/g, '');
            // Grey Box Logic: Index is in highlightedIndices AND NOT in wordColors
            const isGreyBoxed = Array.from({ length: w.text.length }, (_, k) => w.globalIndex + k).some(idx => highlightedIndices.has(idx) && !wordColors[idx]);

            return {
                ...w,
                clean,
                index: i,
                isGreyBoxed
            };
        }).filter(w => w.clean.length > 2);

        if (cleanWords.length < 1) return null;

        let targets = [];
        if (mode === 'marked') {
            targets = cleanWords.filter(w => w.isGreyBoxed);
            if (targets.length === 0) return null;
        } else {
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
            targets = [candidates[Math.floor(Math.random() * candidates.length)]];
        }

        const parts = [];
        const targetIndices = new Set(targets.map(t => t.index));

        wordsInSentence.forEach((w, i) => {
            if (targetIndices.has(i)) {
                const target = targets.find(t => t.index === i);
                const trailingPunctuation = w.text.match(/[.,!?;:]+$/);
                if (trailingPunctuation) {
                    const cleanWord = w.text.substring(0, w.text.length - trailingPunctuation[0].length);
                    parts.push({ type: 'gap', id: `gap_${sIdx}_${i}`, correctText: cleanWord, cleanText: target.clean });
                    parts.push({ type: 'text', text: trailingPunctuation[0] });
                } else {
                    parts.push({ type: 'gap', id: `gap_${sIdx}_${i}`, correctText: w.text, cleanText: target.clean });
                }
            } else {
                parts.push({ type: 'text', text: w.text });
            }
        });

        return {
            id: `s_${sIdx}`,
            parts,
            targets: targets.map(t => ({
                ...t,
                text: t.text.replace(/[.,!?;:]+$/, ''), // Clean word for pool card
                id: `gap_${sIdx}_${t.index}`
                // color: WORD_COLORS[(sIdx + t.index) % WORD_COLORS.length] // Removed per user request
            }))
        };
    };

    // Partition logic for groups
    useEffect(() => {
        if (!text) return;
        const rawSentences = splitSentences(text);
        // User requested original order:
        const processed = rawSentences.map((s, i) => processSentence(s, i)).filter(Boolean);

        // If in marked mode and no sentences processing, it means no marked words found
        if (processed.length === 0) {
            setGroups([]);
            return;
        }

        const partition = (n) => {
            if (n <= itemsPerStage) return [n];
            const count = Math.ceil(n / itemsPerStage);
            const size = n / count;
            const sizes = [];
            let rem = n;
            while (rem > 0) {
                const s = Math.min(rem, Math.ceil(size));
                sizes.push(s);
                rem -= s;
            }
            return sizes;
        };

        const sizes = partition(processed.length);
        const newGroups = [];
        let cur = 0;
        sizes.forEach(s => {
            newGroups.push(processed.slice(cur, cur + s));
            cur += s;
        });

        setGroups(newGroups);
        setCurrentGroupIdx(0);
        setPendingItemsCount(itemsPerStage);
    }, [text, mode, highlightedIndices, wordColors, itemsPerStage]);

    const handleItemsCountChange = (delta) => {
        const next = Math.max(2, Math.min(10, pendingItemsCount + delta));
        if (next === pendingItemsCount) return;

        setPendingItemsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setItemsPerStage(next);
            debounceTimerRef.current = null;
        }, 1200);
    };

    const currentGroup = useMemo(() => groups[currentGroupIdx] || [], [groups, currentGroupIdx]);

    // Pool Management
    useEffect(() => {
        if (currentGroup.length === 0) return;
        const targets = currentGroup.flatMap(s => s.targets).map(t => ({ ...t, poolId: `pool_${t.id}` }));
        const shuffled = [...targets].sort(() => Math.random() - 0.5);
        setPoolWords(shuffled);
        setPlacedWords({});
        setGroupSolved(false);
    }, [currentGroup]);

    const handlePointerDrop = (dragItem, targetId) => {
        // dragItem: { word, source, gapId }
        // targetId: 'gap_S_I', 'pool', 'background'

        const { word, source, gapId } = dragItem;

        if (targetId === 'background' || targetId === 'pool') {
            // Drop to background/pool -> Remove from gap
            if (source === 'gap' && gapId) {
                setPlacedWords(prev => {
                    const next = { ...prev };
                    delete next[gapId];
                    return next;
                });
                setPoolWords(prev => [...prev, word]);
            }
        } else if (targetId && targetId.startsWith('gap_')) {

            // My generic ID is `gap_...`. 
            // The registerDropZone calls `gap_${p.id}` where p.id IS `gap_${sIdx}_${i}`.
            // So targetId will be `gap_gap_${sIdx}_${i}`? 
            // NO. usage: `ref={registerDropZone(p.id)}`. p.id is `gap_0_1`.
            // So targetId in handlePointerDrop will be `gap_0_1`.
            // So I don't need to strip prefix if I register exact ID.

            // BUT, in GapWordsView I registered as `gap_${chunk.id}`. Here p.id already has 'gap_' prefix?
            // processSentence: `id: Gap_${sIdx}_${i}`
            // Yes.

            // So logic:
            const targetGapId = targetId;

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

        // Allow placement even if incorrect
        const wordToPlace = selectedWord;
        const existingWord = placedWords[gapId];

        setPlacedWords(prev => ({ ...prev, [gapId]: wordToPlace }));
        setPoolWords(prev => {
            let next = prev.filter(w => w.poolId !== wordToPlace.poolId);
            if (existingWord) next = [...next, existingWord];
            return next;
        });
        setSelectedWord(null);
    };

    // Solution Checking
    useEffect(() => {
        if (currentGroup.length === 0) return;

        const totalGaps = currentGroup.reduce((acc, s) => acc + s.targets.length, 0);
        const placedCount = Object.keys(placedWords).length;

        if (placedCount === totalGaps) {
            // Check correctness of all placed words
            let allCorrect = true;

            for (const sentence of currentGroup) {
                for (const p of sentence.parts) {
                    if (p.type === 'gap') {
                        const placed = placedWords[p.id];
                        if (!placed) {
                            allCorrect = false;
                            break;
                        }
                        const cleanPlaced = placed.text.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();
                        const cleanTarget = p.correctText.replace(/[^\w\u00C0-\u017F]/g, '').toLowerCase();
                        if (cleanPlaced !== cleanTarget) {
                            allCorrect = false;
                        }
                    }
                }
                if (!allCorrect) break;
            }

            if (allCorrect) {
                setGroupSolved(true);
                if (currentGroupIdx === groups.length - 1) {
                    setTimeout(() => setShowReward(true), 800);
                }
            } else {
                setGroupSolved(false); // Filled but incorrect
            }
        } else {
            setGroupSolved(false);
        }
    }, [placedWords, currentGroup, currentGroupIdx, groups.length]);

    if (!text) {
        return <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center p-6 modal-animate font-sans"><EmptyStateMessage onClose={onClose} title="Keine Sätze gefunden" message="Der Text ist zu kurz oder enthält keine klaren Sätze für diese Übung." /></div>;
    }

    if (groups.length === 0) {
        if (mode === 'marked' && Object.keys(wordColors).length === 0) {
            return (
                <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
                    <EmptyStateMessage onClose={onClose} />
                </div>
            );
        }
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
                <EmptyStateMessage onClose={onClose} firstStepText="Grauen Kasten anklicken!" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none">
            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alles richtig ergänzt! Super!"
            />

            {/* Header */}
            <ExerciseHeader
                title={title || "Lückensätze"}
                icon={Icons.GapSentences}
                current={currentGroupIdx + 1}
                total={groups.length}
                progressPercentage={(groups.length > 0 ? ((currentGroupIdx + 1) / groups.length) * 100 : 0)}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={20}
                sliderMax={128}
                customControls={
                    <>
                        <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                            <button
                                onClick={() => setMode('marked')}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all font-bold text-xs ${mode === 'marked' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className={`w-5 h-4 rounded border-2 transition-all mr-1 ${mode === 'marked' ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-transparent'}`} />
                                markiert
                            </button>
                            <button
                                onClick={() => setMode('random')}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all font-bold text-xs ${mode === 'random' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Icons.Dice5 size={16} className={mode === 'random' ? 'text-blue-500' : 'text-slate-400'} />
                                zufällig
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                            <HorizontalLines count={2} />
                            <button
                                onClick={() => handleItemsCountChange(-1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1"
                                disabled={pendingItemsCount <= 2}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span className={`text-xl font-black transition-colors leading-none ${pendingItemsCount !== itemsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                    {pendingItemsCount}
                                </span>
                            </div>
                            <button
                                onClick={() => handleItemsCountChange(1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1"
                                disabled={pendingItemsCount >= 10}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <HorizontalLines count={5} />
                        </div>
                    </>
                }
            />

            <div className="flex-1 flex overflow-hidden">
                <div
                    className="flex-1 p-8 overflow-y-auto custom-scroll flex flex-col gap-8 bg-white/50"
                    ref={registerDropZone('background')}
                >
                    <div className="max-w-7xl mx-auto space-y-12 py-24">
                        {currentGroup.map(sentence => (
                            <div key={sentence.id} className="flex flex-wrap items-center text-slate-800 leading-relaxed" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily, columnGap: `${(settings.wordSpacing ?? 0.5)}em`, rowGap: '1.5em' }}>
                                {sentence.parts.map((p, i) => {
                                    if (p.type === 'text') {
                                        return p.text.split(/(\s+)/).map((seg, sidx) => {
                                            if (seg.trim().length === 0) return null;
                                            return (
                                                <Word
                                                    key={`${i}-${sidx}`}
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
                                            key={i}
                                            ref={registerDropZone(p.id)}
                                            onClick={() => handleGapClick(p.id, p.correctText)}
                                            className={`relative inline-flex items-center justify-center min-w-[4em] h-[2.2em] border-b-4 transition-all rounded-t-xl cursor-pointer ${placed ? 'border-transparent' : 'border-slate-300 bg-slate-100/50 hover:bg-white hover:border-blue-400'} ${selectedWord ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''} ${hoveredZoneId === p.id ? 'bg-blue-100/50 ring-2 ring-blue-200' : ''}`}
                                        >
                                            {placed ? (
                                                <div
                                                    {...getDragProps({ word: placed, source: 'gap', gapId: p.id }, p.id)}
                                                    className={`px-1 py-0 rounded font-bold cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] whitespace-nowrap leading-none select-none text-blue-600 ${isPointerDragging && dragState?.sourceId === p.id ? 'opacity-40' : ''}`}
                                                    style={{ fontSize: '1.2em', touchAction: 'none' }}
                                                >
                                                    <Word
                                                        word={placed.text}
                                                        startIndex={0} // Dummy index
                                                        settings={settings}
                                                        hyphenator={hyphenator}
                                                        isReadingMode={true} // Disable interactions
                                                        forceNoMargin={true}
                                                        forceShowSyllables={true}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="opacity-0 font-bold">{p.correctText}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {groupSolved && currentGroupIdx < groups.length - 1 && (
                        <div className="mt-12 w-full max-w-7xl flex flex-col items-end pb-20">
                            <span className="text-green-600 font-bold mb-4 flex items-center gap-2 text-xl animate-bounce"><Icons.Check size={28} /> Richtig!</span>
                            <button
                                onClick={() => { setCurrentGroupIdx(prev => prev + 1); setGroupSolved(false); }}
                                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3 text-xl ring-4 ring-white/50"
                            >
                                Weiter <Icons.ArrowRight size={24} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20" ref={registerDropZone('pool')}>
                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wortauswahl</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-4">
                        {poolWords.map((w) => (
                            <div
                                key={w.poolId}
                                {...getDragProps({ word: w, source: 'pool' }, w.poolId)}
                                onClick={() => handlePoolWordClick(w)}
                                className={`w-full p-4 font-bold rounded-2xl transition-all flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-[1.02] select-none bg-white border border-blue-600 text-slate-800 ${selectedWord?.poolId === w.poolId ? 'scale-105 ring-4 ring-blue-500/20' : ''} ${isPointerDragging && dragState?.sourceId === w.poolId ? 'opacity-40' : ''}`}
                                style={{
                                    fontFamily: settings.fontFamily,
                                    fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`,
                                    touchAction: 'none'
                                }}
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
                </div>

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
            </div>
        </div>
    );
};
