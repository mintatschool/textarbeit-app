import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { shuffleArray } from '../utils/arrayUtils';

import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';
import { HorizontalLines } from './shared/UIComponents';
import { usePreventTouchScroll } from '../hooks/usePreventTouchScroll';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { getTerm } from '../utils/terminology';

import { usePointerDrag } from '../hooks/usePointerDrag';
// Removed polyfill import
export const GapWordsView = ({ words, settings, setSettings, onClose, isInitialSound = false, title, highlightedIndices = new Set(), wordColors = {} }) => {
    const [mode, setMode] = useState('vowels'); // 'vowels', 'consonants', or 'marked'
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedLetters, setPlacedLetters] = useState({}); // { gapId: letterObj }
    const [speicherLetters, setSpeicherLetters] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const [solvedWordIds, setSolvedWordIds] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState(null); // For Click-to-Place
    const [wordsPerStage, setWordsPerStage] = useState(5);
    const [pendingWordsCount, setPendingWordsCount] = useState(5);
    const debounceTimerRef = useRef(null);

    // iPad Fix: Prevent touch scrolling during drag handled by hook

    // Audio support
    const speakWord = (text) => {
        speak(text);
    };

    // Letter Cluster Definition (German common clusters)
    const clusters = ['sch', 'chs', 'ch', 'qu', 'st', 'sp', 'ei', 'ie', 'au', 'eu', 'äu', 'ck', 'ng', 'nk', 'pf', 'th'];

    // Helper to check for clusters and vowels
    const isVowel = (char) => /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);

    // Improved Char Logic: Handle clusters
    const getWordChunks = (word, mode, isFirstSyllable = false, isWordStart = false, globalOffset = 0) => {
        const chunks = [];
        let i = 0;
        // Check for "initial sound mode" override or similar if needed, but getWordChunks handles basic char logic.
        // It relies on 'isInitialSound' from outer scope? No, passing 'isWordStart'.
        // But internally it uses 'isInitialSound'? No, let's check definition. 
        // It uses 'isVowel' helper.

        // Helper component for horizontal lines in the stepper control
        const text = word.toLowerCase();

        if (isInitialSound) {
            // In initial sound mode, handle clusters at the very beginning
            let clusterLen = 0;
            // Check for clusters (3 chars then 2 chars) at index 0
            for (let len = 3; len >= 2; len--) {
                const sub = text.substring(0, len);
                if (clusters.includes(sub)) {
                    clusterLen = len;
                    break;
                }
            }

            if (clusterLen > 0) {
                // First gap is the cluster
                chunks.push({
                    text: word.substring(0, clusterLen),
                    isTarget: isWordStart,
                    id: `chunk_0`
                });
                // Rest of the word
                for (let j = clusterLen; j < word.length; j++) {
                    chunks.push({
                        text: word[j],
                        isTarget: false,
                        id: `chunk_${j}`
                    });
                }
            } else {
                // No cluster, standard single char first gap
                for (let j = 0; j < word.length; j++) {
                    chunks.push({
                        text: word[j],
                        isTarget: isWordStart && j === 0,
                        id: `chunk_${j}`
                    });
                }
            }
            return chunks;
        }

        // Syllable rule: Count consonants to ensure at least one remains
        const consonantCount = [...text].filter(c => /[a-zäöü]/.test(c) && !isVowel(c)).length;

        while (i < word.length) {
            let foundCluster = false;
            // Check for clusters (3 chars then 2 chars)
            for (let len = 3; len >= 2; len--) {
                const sub = text.substring(i, i + len);
                if (clusters.includes(sub)) {
                    const originalSub = word.substring(i, i + len);
                    let isTarget = false;
                    if (mode === 'vowels') {
                        isTarget = [...sub].some(isVowel);
                    } else if (mode === 'marked') {
                        // Marked Mode in getWordChunks
                        const idx = globalOffset + i;
                        isTarget = false; // Clusters in marked mode? 
                        // Logic: check if any char in cluster is highlighted AND colored
                        for (let k = 0; k < len; k++) {
                            if (highlightedIndices.has(idx + k) && wordColors[idx + k]) {
                                isTarget = true;
                                break;
                            }
                        }
                    } else {
                        // Consonant Mode
                        if (isFirstSyllable && i === 0) {
                            isTarget = false; // Anchor protection
                        } else if (consonantCount <= 1) {
                            isTarget = false;
                        } else {
                            isTarget = [...sub].some(c => /[a-zäöü]/.test(c) && !isVowel(c));
                        }
                    }

                    chunks.push({ text: originalSub, isTarget, id: `chunk_${i}` });
                    i += len;
                    foundCluster = true;
                    break;
                }
            }

            if (!foundCluster) {
                const char = word[i];
                let isTarget = false;

                if (mode === 'marked') {
                    const idx = globalOffset + i;
                    isTarget = highlightedIndices.has(idx) && !!wordColors[idx];
                } else {
                    isTarget = /[a-zA-ZäöüÄÖÜ]/.test(char) && (mode === 'vowels' ? isVowel(char) : !isVowel(char));
                    if (mode === 'consonants' && isTarget) {
                        if (isFirstSyllable && i === 0) isTarget = false;
                        else if (consonantCount <= 1) isTarget = false;
                    }
                }

                chunks.push({ text: char, isTarget, id: `chunk_${i}` });
                i++;
            }
        }
        return chunks;
    };

    // Grouping Logic
    useEffect(() => {
        if (!words || words.length === 0) return;

        const shuffledWords = shuffleArray(words);
        let wordsToGroup = shuffledWords;

        if (mode === 'marked') {
            // Filter words that have marked letters
            wordsToGroup = words.filter(w => {
                let currentSyllableOffset = w.index || 0;
                return w.syllables.some((syl, sIdx) => {
                    const chunks = getWordChunks(syl, mode, sIdx === 0, sIdx === 0, currentSyllableOffset);
                    currentSyllableOffset += syl.length;
                    return chunks.some(c => c.isTarget);
                });
            });
        }

        if (mode === 'marked' && wordsToGroup.length === 0) {
            setGroups([]);
            setCurrentGroupIdx(0);
            return;
        }

        const partition = (n) => {
            const size = wordsPerStage;
            const result = [];
            for (let i = 0; i < n; i += size) {
                result.push(Math.min(size, n - i));
            }
            return result;
        };

        const groupSizes = partition(wordsToGroup.length);
        const newGroups = [];
        let currentIdx = 0;
        groupSizes.forEach(size => {
            newGroups.push(wordsToGroup.slice(currentIdx, currentIdx + size));
            currentIdx += size;
        });
        setGroups(newGroups);
        setCurrentGroupIdx(0);
        setPendingWordsCount(wordsPerStage);
    }, [words, wordsPerStage, mode, highlightedIndices, wordColors]);



    const currentWords = useMemo(() => {
        if (groups.length === 0) return [];
        const group = groups[currentGroupIdx];
        return group.map((w, wIdx) => {
            let currentSyllableOffset = w.index || 0;
            const syllables = w.syllables.map((syl, sIdx) => {
                const chunks = getWordChunks(syl, mode, sIdx === 0, sIdx === 0, currentSyllableOffset).map((chunk, cIdx) => ({
                    ...chunk,
                    id: `${w.id}_s${sIdx}_c${cIdx}`,
                    syllableIdx: sIdx
                }));
                currentSyllableOffset += syl.length;
                return { text: syl, chunks };
            });

            // Refined Consonants Mode logic: for "long" words (2+ syllables), exactly 2 gaps, different syllables, not adjacent.
            if (mode === 'consonants' && !isInitialSound && syllables.length >= 2) {
                const allPotentialTargets = [];
                syllables.forEach((syl, sIdx) => {
                    syl.chunks.forEach((chunk, cIdx) => {
                        if (chunk.isTarget) {
                            allPotentialTargets.push({ ...chunk, sIdx, cIdx });
                        }
                    });
                });

                let selectedIds = [];
                if (allPotentialTargets.length >= 2) {
                    const candidates = [];
                    const flatChunks = syllables.flatMap(s => s.chunks);

                    for (let i = 0; i < allPotentialTargets.length; i++) {
                        for (let j = i + 1; j < allPotentialTargets.length; j++) {
                            const t1 = allPotentialTargets[i];
                            const t2 = allPotentialTargets[j];

                            if (t1.sIdx === t2.sIdx) continue;

                            const idx1 = flatChunks.findIndex(c => c.id === t1.id);
                            const idx2 = flatChunks.findIndex(c => c.id === t2.id);

                            if (Math.abs(idx1 - idx2) > 1) {
                                candidates.push([t1.id, t2.id]);
                            }
                        }
                    }

                    if (candidates.length > 0) {
                        selectedIds = candidates[Math.floor(Math.random() * candidates.length)];
                    } else if (allPotentialTargets.length > 0) {
                        selectedIds = [allPotentialTargets[Math.floor(Math.random() * allPotentialTargets.length)].id];
                    }
                } else if (allPotentialTargets.length > 0) {
                    selectedIds = [allPotentialTargets[0].id];
                }

                syllables.forEach(syl => {
                    syl.chunks.forEach(chunk => {
                        if (chunk.isTarget) {
                            chunk.isTarget = selectedIds.includes(chunk.id);
                        }
                    });
                });
            } else if (mode === 'consonants' && !isInitialSound && syllables.length === 1) {
                const targets = syllables[0].chunks.filter(c => c.isTarget);
                if (targets.length > 1) {
                    const pickedId = targets[Math.floor(Math.random() * targets.length)].id;
                    syllables[0].chunks.forEach(chunk => {
                        if (chunk.isTarget) chunk.isTarget = (chunk.id === pickedId);
                    });
                }
            }

            // Fallback: Ensure at least one gap per word
            const hasAnyGap = syllables.some(s => s.chunks.some(c => c.isTarget));
            if (!hasAnyGap && mode !== 'marked') {
                // Try to find any consonant (even if protected)
                const allChunks = syllables.flatMap(s => s.chunks);
                const anyConsonant = allChunks.find(c => [...c.text.toLowerCase()].some(ch => /[a-zäöü]/.test(ch) && !isVowel(ch)));
                if (anyConsonant) {
                    anyConsonant.isTarget = true;
                } else {
                    // Last resort: pick any letter (vowel)
                    const anyLetter = allChunks.find(c => /[a-zA-ZäöüÄÖÜ]/.test(c.text));
                    if (anyLetter) anyLetter.isTarget = true;
                }
            }

            return { ...w, syllables };
        }).filter(Boolean); // CURRENT WORDS IS FILTERED HERE
    }, [groups, currentGroupIdx, mode, isInitialSound, highlightedIndices, wordColors]);

    // BUT `groups` generation logic is separate!
    // I need to update the useEffect that SETS groups.

    // Letter Pool Logic & Reset
    useEffect(() => {
        if (currentWords.length === 0) {
            setSpeicherLetters([]);
            setPlacedLetters({});
            setGroupSolved(false);
            setSolvedWordIds(new Set());
            return;
        }
        const targets = currentWords.flatMap(w =>
            w.syllables.flatMap(s => s.chunks.filter(c => c.isTarget).map(c => ({ ...c, poolId: `pool_${c.id}` })))
        );

        // Shuffle targets
        const shuffled = [...targets];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Grid-based positioning
        setSpeicherLetters(shuffled);
        setPlacedLetters({});
        setGroupSolved(false);
        setSolvedWordIds(new Set());
    }, [currentWords, mode, isInitialSound]);


    const handlePointerDrop = (dragItem, targetId) => {
        // dragItem: { letter, source, gapId }
        // targetId: 'gap_XYZ', 'pool', 'background'

        const { letter, source, gapId } = dragItem;

        if (targetId === 'background' || targetId === 'pool') {
            // Drop to background/pool -> Remove from gap
            if (source === 'gap' && gapId) {
                setPlacedLetters(prev => {
                    const next = { ...prev };
                    delete next[gapId];
                    return next;
                });
                setSpeicherLetters(prev => [...prev, letter]);
            }
        } else if (targetId && targetId.startsWith('gap_')) {
            const targetGapId = targetId.replace('gap_', '');

            // Allow same logic as original handleDrop
            const existingLetter = placedLetters[targetGapId];

            setPlacedLetters(prev => {
                const next = { ...prev };
                next[targetGapId] = letter;
                if (source === 'gap' && gapId) delete next[gapId];
                return next;
            });

            setSpeicherLetters(prev => {
                let next = prev;
                if (source === 'pool') next = next.filter(l => l.poolId !== letter.poolId);
                if (existingLetter) next = [...next, existingLetter];
                return next;
            });
        }
    };

    const { getDragProps, registerDropZone, dragState, hoveredZoneId, isDragging: isPointerDragging } = usePointerDrag({
        onDrop: handlePointerDrop
    });

    // Old handlers removed (handleBackgroundDrop, handleDragStart, handleDragEnd, handleDrop, handleSpeicherDrop)

    // Click-to-Place Handlers
    const handleSpeicherLetterClick = (letter) => {
        if (selectedLetter?.poolId === letter.poolId) {
            setSelectedLetter(null);
        } else {
            setSelectedLetter(letter);
        }
    };

    const handleGapClick = (gapId, correctText) => {
        if (!selectedLetter) {
            // If already filled, return to pool on click
            if (placedLetters[gapId]) {
                const letter = placedLetters[gapId];
                setPlacedLetters(prev => { const next = { ...prev }; delete next[gapId]; return next; });
                setSpeicherLetters(prev => [...prev, letter]);
            }
            return;
        }

        // CHANGED: Allow incorrect insertion via Click-to-Place
        const letterToPlace = selectedLetter;
        const existingLetter = placedLetters[gapId];

        setPlacedLetters(prev => ({ ...prev, [gapId]: letterToPlace }));
        setSpeicherLetters(prev => {
            let next = prev.filter(l => l.poolId !== letterToPlace.poolId);
            if (existingLetter) next = [...next, existingLetter];
            return next;
        });
        setSelectedLetter(null);
    };

    const handleWordsCountChange = (delta) => {
        const next = Math.max(2, Math.min(8, pendingWordsCount + delta));
        if (next === pendingWordsCount) return;

        setPendingWordsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setWordsPerStage(next);
            debounceTimerRef.current = null;
        }, 1200);
    };

    // Progress Tracking
    useEffect(() => {
        if (currentWords.length === 0) return;

        // Track per-word success for visual feedback
        const newSolvedIds = new Set();
        currentWords.forEach(w => {
            // CHANGED: Strict validation only here - check if placed letter matches target text
            const isSolved = w.syllables.every(s => s.chunks.every(c => {
                if (!c.isTarget) return true;
                const placed = placedLetters[c.id];
                return placed && placed.text === c.text;
            }));
            if (isSolved) newSolvedIds.add(w.id);
        });
        setSolvedWordIds(newSolvedIds);

        const totalTargets = currentWords.reduce((acc, w) => acc + w.syllables.reduce((sAcc, s) => sAcc + s.chunks.filter(c => c.isTarget).length, 0), 0);

        // Group solved only if ALL words are solved (all targets filled correctly)
        // Check if all targets have CORRECT letters
        const allCorrect = currentWords.every(w =>
            w.syllables.every(s => s.chunks.every(c => {
                if (!c.isTarget) return true;
                const placed = placedLetters[c.id];
                return placed && placed.text === c.text;
            }))
        );

        if (allCorrect) {
            setGroupSolved(true);
        } else {
            setGroupSolved(false);
        }
    }, [placedLetters, currentWords]);

    // Handle Group Completion & Reward
    useEffect(() => {
        if (groupSolved && !showReward && currentGroupIdx === groups.length - 1 && groups.length > 0) {
            const timer = setTimeout(() => {
                setShowReward(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [groupSolved, currentGroupIdx, groups.length, showReward]);

    if (!words || words.length === 0) return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} title="Keine Wörter markiert" /></div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans select-none">

            {/* Empty State for Marked Mode */}
            {mode === 'marked' && groups.every(g => g.length === 0) && (
                <div className="absolute inset-0 z-[110] bg-slate-100 flex flex-col items-center justify-center p-6 bg-opacity-95 font-sans">
                    <EmptyStateMessage
                        onClose={() => setMode('vowels')}
                        // IconComponent removed to use default SelectionHint
                        title="Bitte markiere zuerst Buchstaben im Text!"
                        firstStepText="Buchstaben-Symbol anklicken!"
                        secondStepText="Buchstaben markieren."
                    />
                </div>
            )}

            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alle Lücken gefüllt! Toll!"
            />

            <ExerciseHeader
                title={title || (isInitialSound ? 'Anfangsbuchstaben finden' : 'Lückenwörter')}
                icon={isInitialSound ? Icons.InitialSound : Icons.GapWords}
                current={currentGroupIdx + 1}
                total={groups.length}
                progressPercentage={(groups.length > 0 ? ((currentGroupIdx + 1) / groups.length) * 100 : 0)}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={24}
                sliderMax={100}
                customControls={
                    <>
                        {!isInitialSound && (
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
                                <button
                                    onClick={() => setMode('marked')}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all font-bold text-sm mr-1 ${mode === 'marked' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Icons.LetterMarker size={20} />
                                </button>
                                <div className="w-px bg-slate-300 my-2 mx-1"></div>
                                <button
                                    onClick={() => setMode('vowels')}
                                    className={`px-2 py-2 rounded-lg font-bold text-base transition-all ${mode === 'vowels' ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                >
                                    {getTerm("Vokale", settings)}
                                </button>
                                <button
                                    onClick={() => setMode('consonants')}
                                    className={`px-2 py-2 rounded-lg font-bold text-base transition-all ${mode === 'consonants' ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                >
                                    {getTerm("Konsonanten", settings)}
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                            <HorizontalLines count={2} />
                            <button onClick={() => handleWordsCountChange(-1)} disabled={pendingWordsCount <= 2} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                                <Icons.Minus size={16} />
                            </button>
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                    {pendingWordsCount}
                                </span>
                            </div>
                            <button onClick={() => handleWordsCountChange(1)} disabled={pendingWordsCount >= 8} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                                <Icons.Plus size={16} />
                            </button>
                            <HorizontalLines count={5} />
                        </div>
                    </>
                }
            />

            <div className={`flex-1 flex overflow-hidden bg-white/50 ${isInitialSound ? 'flex flex-row-reverse' : ''}`}>
                {/* Fixed Layout: Centering wrapper that allows proper scrolling without top-clipping - CHANGED: justify-start and more padding */}
                {/* Content Column - Scrolls independently - Added background drop handler */}
                <div
                    className="flex-1 overflow-y-auto custom-scroll min-h-full pt-12 pb-48 px-8 flex flex-col items-center justify-start gap-12 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
                    ref={registerDropZone('background')}
                >
                    <div className="w-full max-w-4xl space-y-4">
                        {currentWords.map((word) => {
                            const isSolved = solvedWordIds.has(word.id);
                            // Check for errors in Initial Sound mode when all letters are placed
                            const hasErrors = isInitialSound && speicherLetters.length === 0 && word.syllables.some(s => s.chunks.some(c => {
                                const placed = placedLetters[c.id];
                                return c.isTarget && placed && placed.text !== c.text;
                            }));

                            return (
                                <div key={word.id} className={`p-8 bg-white rounded-3xl border shadow-sm flex flex-wrap justify-center items-center gap-x-4 gap-y-4 transition-all duration-500 transform relative ${isSolved ? 'border-green-300 bg-green-50/50 scale-[1.01] shadow-md' : hasErrors ? 'border-red-400 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex flex-wrap justify-center gap-x-1 gap-y-12">
                                        {word.syllables.map((syl, sIdx) => {
                                            const isEven = sIdx % 2 === 0;
                                            let styleClass = "";
                                            // User Request: "Die Schrift soll sich nicht den Silbenbögen anpassen" -> Force Black for text
                                            let textClass = "text-slate-900";

                                            // Keep Block logic if enabled, but text remains black
                                            if (settings.visualType === 'block') {
                                                styleClass = isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50';
                                                styleClass += " border rounded px-1.5 py-0.5 mx-[1px]";
                                            }

                                            return (
                                                <div key={sIdx} className={`relative flex items-baseline ${styleClass}`} style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                                    {syl.chunks.map((chunk, chunkIdx) => {
                                                        const isVowelChunk = [...chunk.text.toLowerCase()].some(isVowel);
                                                        const showYellowStatic = (mode === 'consonants' || isInitialSound) && isVowelChunk;

                                                        if (!chunk.isTarget) {
                                                            // Neighbor-aware merging for adjacent yellow vowel chunks
                                                            if (showYellowStatic) {
                                                                const prevChunk = chunkIdx > 0 ? syl.chunks[chunkIdx - 1] : null;
                                                                const nextChunk = chunkIdx < syl.chunks.length - 1 ? syl.chunks[chunkIdx + 1] : null;
                                                                const prevIsYellow = prevChunk && !prevChunk.isTarget && [...prevChunk.text.toLowerCase()].some(isVowel);
                                                                const nextIsYellow = nextChunk && !nextChunk.isTarget && [...nextChunk.text.toLowerCase()].some(isVowel);

                                                                let rounded = 'rounded-sm';
                                                                if (prevIsYellow && nextIsYellow) rounded = 'rounded-none';
                                                                else if (prevIsYellow) rounded = 'rounded-r-sm rounded-l-none';
                                                                else if (nextIsYellow) rounded = 'rounded-l-sm rounded-r-none';

                                                                return (
                                                                    <span
                                                                        key={chunk.id}
                                                                        className={`font-bold ${textClass} bg-yellow-100 text-slate-900 ${rounded}`}
                                                                        style={{
                                                                            paddingLeft: '0.08em',
                                                                            paddingRight: '0.08em',
                                                                            paddingTop: '0.05em',
                                                                            paddingBottom: '0.08em',
                                                                        }}
                                                                    >
                                                                        {chunk.text}
                                                                    </span>
                                                                );
                                                            }
                                                            return (
                                                                <span
                                                                    key={chunk.id}
                                                                    className={`font-bold ${textClass}`}
                                                                >
                                                                    {chunk.text}
                                                                </span>
                                                            );
                                                        }
                                                        const placed = placedLetters[chunk.id];

                                                        // showYellowStyle logic (Existing):
                                                        const showYellowStyle = (!isInitialSound && mode === 'vowels' && placed) || (mode === 'consonants' && isVowelChunk) || (isInitialSound && placed && isVowelChunk);

                                                        // New Color Logic for Placed Letters:
                                                        // 1. Vowels: "so bleiben wie sie sind" -> showYellowStyle handles yellow bg/etc. Text color? 
                                                        //    If yellow style is active, usually text-slate-900.
                                                        // 2. Consonants: "dunkelblau".

                                                        let placedTextClass = "text-blue-600"; // Default
                                                        if (placed) {
                                                            const isPlacedVowel = [...placed.text.toLowerCase()].some(isVowel);
                                                            if (isPlacedVowel) {
                                                                // Vowel -> Keep existing style (usually black on yellow or blue if not yellow)
                                                                // If "so bleiben wie sie sind", implies assuming current behavior is correct for vowels.
                                                                // Current behavior uses 'text-slate-900' if yellow, or 'text-blue-600' otherwise?
                                                                // Let's stick to 'text-slate-900' if yellow.
                                                                placedTextClass = showYellowStyle ? "text-slate-900" : "text-blue-600";
                                                            } else {
                                                                // Consonant -> Dark Blue
                                                                placedTextClass = "text-blue-900";
                                                            }
                                                        }

                                                        return (
                                                            <div
                                                                key={chunk.id}
                                                                ref={registerDropZone(`gap_${chunk.id}`)}
                                                                onClick={() => handleGapClick(chunk.id, chunk.text)}
                                                                className={`relative flex items-center justify-center transition-all mx-2 rounded-t-xl gap-zone cursor-pointer pb-0 
                                                                    ${placed && speicherLetters.length === 0
                                                                        ? (placed.text === chunk.text
                                                                            ? (isInitialSound ? 'border-b-4 border-transparent' : 'border-2 border-green-400 bg-white/50')
                                                                            : (isInitialSound ? 'border-b-4 border-transparent' : 'border-2 border-red-400 bg-white/50'))
                                                                        : placed
                                                                            ? 'border-b-4 border-transparent'
                                                                            : 'border-b-4 border-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-500'
                                                                    }
                                                                    ${selectedLetter ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''} ${hoveredZoneId === `gap_${chunk.id}` ? 'bg-blue-100/50 ring-2 ring-blue-200' : ''}`}
                                                                style={{ minWidth: `${Math.max(1.2, chunk.text.length * 0.9)}em`, height: '1.75em' }}
                                                            >
                                                                {placed ? (
                                                                    <div
                                                                        {...getDragProps({ letter: placed, source: 'gap', gapId: chunk.id }, chunk.id)}
                                                                        className={`font-bold transition-all px-1 rounded-sm cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] select-none ${showYellowStyle ? 'bg-yellow-100 mx-px' : ''} ${placedTextClass} ${isPointerDragging && dragState?.sourceId === chunk.id ? 'opacity-40' : ''}`}
                                                                    >
                                                                        {placed.text}
                                                                    </div>
                                                                ) : (
                                                                    <span className="opacity-0">{chunk.text}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {settings.visualType === 'arc' && (
                                                        <svg className="absolute -bottom-6 left-0 w-full h-4 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 5 5 Q 50 20 95 5" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="10" strokeLinecap="round" /></svg>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Audio Button per word */}
                                    <button
                                        onClick={() => speakWord(word.word)}
                                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ring-4 ring-white/50 hover:scale-105 active:scale-95 ml-4"
                                        title="Anhören"
                                    >
                                        <Icons.Volume2 size={24} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {groupSolved && currentGroupIdx < groups.length - 1 && (
                        <div className="mt-12 w-full max-w-4xl flex justify-end">
                            <button
                                onClick={() => { setCurrentGroupIdx(prev => prev + 1); setGroupSolved(false); }}
                                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3 text-xl ring-4 ring-white/50 transition-all"
                            >
                                Weiter <Icons.ArrowRight size={24} />
                            </button>
                        </div>
                    )}
                </div>

                <div className={`${isInitialSound ? 'w-[200px]' : 'w-[30%]'} h-full flex flex-col bg-slate-200/50 border-l border-r border-slate-300 shadow-inner z-20`} ref={registerDropZone('pool')}>
                    <div className="p-4 bg-white/80 border-b border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider text-[10px]">Speicher</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{speicherLetters.length}</span>
                        </div>

                    </div>
                    <div className="flex-1 relative overflow-y-auto custom-scroll p-4 flex flex-wrap content-start justify-center gap-3">
                        {speicherLetters.map((l) => {
                            const isVowelTile = [...l.text.toLowerCase()].some(isVowel);
                            // Consonants dark blue in storage, Vowels keep default (slate-800 usually)
                            const tileTextColor = isVowelTile ? 'text-slate-800' : 'text-blue-900';

                            return (
                                <div
                                    key={l.poolId}
                                    {...getDragProps({ letter: l, source: 'pool' }, l.poolId)}
                                    onClick={() => handleSpeicherLetterClick(l)}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className={`border-2 ${tileTextColor} font-bold rounded-2xl transition-all flex items-center justify-center p-3 cursor-grab active:cursor-grabbing hover:scale-110 bg-white border-slate-300 hover:translate-y-[2px] draggable-piece ${isVowelTile ? 'bg-yellow-100 border-yellow-400' : ''} ${selectedLetter?.poolId === l.poolId ? 'selected-piece ring-4 ring-blue-500 !scale-110 z-50' : ''} ${isPointerDragging && dragState?.sourceId === l.poolId ? 'opacity-40' : ''}`}
                                    style={{ fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`, fontFamily: settings.fontFamily, minWidth: '3.5rem' }}
                                >
                                    {l.text}
                                </div>
                            );
                        })}

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
                        <div className={`border-2 font-bold rounded-xl flex items-center justify-center bg-white shadow-xl ${dragState.item.letter.text.length > 2 ? 'px-3' : 'px-2'}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                fontFamily: settings.fontFamily,
                                fontSize: dragState.cloneStyle.fontSize || settings.fontSize + 'px',
                                // Inherit colors? 
                                color: dragState.cloneStyle?.color
                            }}>
                            {dragState.item.letter.text}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
