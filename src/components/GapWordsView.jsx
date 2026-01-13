import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { Minus, Plus } from 'lucide-react';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';

export const GapWordsView = ({ words, settings, setSettings, onClose, isInitialSound = false, title, highlightedIndices = new Set(), wordColors = {} }) => {
    const [mode, setMode] = useState('vowels'); // 'vowels', 'consonants', or 'marked'
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [groups, setGroups] = useState([]);
    const [placedLetters, setPlacedLetters] = useState({}); // { gapId: letterObj }
    const [poolLetters, setPoolLetters] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [groupSolved, setGroupSolved] = useState(false);
    const [solvedWordIds, setSolvedWordIds] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState(null); // For Click-to-Place
    const [wordsPerStage, setWordsPerStage] = useState(5);
    const [pendingWordsCount, setPendingWordsCount] = useState(5);
    const debounceTimerRef = useRef(null);
    const dragItemRef = useRef(null);

    // Helper component for horizontal lines in the stepper control
    const HorizontalLines = ({ count }) => (
        <div className="flex flex-col gap-[2px] w-2 items-center justify-center">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
            ))}
        </div>
    );

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

        let wordsToGroup = words;

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
            setPoolLetters([]);
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
        setPoolLetters(shuffled);
        setPlacedLetters({});
        setGroupSolved(false);
        setSolvedWordIds(new Set());
    }, [currentWords, mode, isInitialSound]);

    // Drag & Drop
    const handleDragStart = (e, letter, source, gapId = null) => {
        setIsDragging(true);
        dragItemRef.current = { letter, source, gapId };
        e.dataTransfer.setData('application/json', JSON.stringify(letter));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        if (e.target.classList) e.target.classList.remove('opacity-40');
        dragItemRef.current = null;
        document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target'));
    };

    // Haptic Feedback für iPad
    const triggerHapticFeedback = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    };

    const handleDrop = (e, targetGapId, targetText) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData) return;

        if (dragData.letter.text.toLowerCase() !== targetText.toLowerCase()) return;

        // Haptic Feedback bei erfolgreichem Drop
        triggerHapticFeedback();

        const existingLetter = placedLetters[targetGapId];

        setPlacedLetters(prev => {
            const next = { ...prev };
            next[targetGapId] = dragData.letter;
            if (dragData.source === 'gap' && dragData.gapId) delete next[dragData.gapId];
            return next;
        });

        setPoolLetters(prev => {
            let next = prev;
            if (dragData.source === 'pool') next = next.filter(l => l.poolId !== dragData.letter.poolId);
            if (existingLetter) next = [...next, existingLetter];
            return next;
        });
    };

    const handlePoolDrop = (e) => {
        e.preventDefault();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.source !== 'gap') return;
        setPlacedLetters(prev => { const next = { ...prev }; delete next[dragData.gapId]; return next; });
        setPoolLetters(prev => [...prev, dragData.letter]);
    };

    // Click-to-Place Handlers
    const handlePoolLetterClick = (letter) => {
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
                setPoolLetters(prev => [...prev, letter]);
            }
            return;
        }

        if (selectedLetter.text.toLowerCase() === correctText.toLowerCase()) {
            // Haptic Feedback bei erfolgreichem Click-to-Place
            triggerHapticFeedback();

            const letterToPlace = selectedLetter;
            const existingLetter = placedLetters[gapId];

            setPlacedLetters(prev => ({ ...prev, [gapId]: letterToPlace }));
            setPoolLetters(prev => {
                let next = prev.filter(l => l.poolId !== letterToPlace.poolId);
                if (existingLetter) next = [...next, existingLetter];
                return next;
            });
            setSelectedLetter(null);
        } else {
            setSelectedLetter(null);
        }
    };

    const handleWordsCountChange = (delta) => {
        const next = Math.max(2, Math.min(6, pendingWordsCount + delta));
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
            const isSolved = w.syllables.every(s => s.chunks.every(c => !c.isTarget || placedLetters[c.id]));
            if (isSolved) newSolvedIds.add(w.id);
        });
        setSolvedWordIds(newSolvedIds);

        const totalTargets = currentWords.reduce((acc, w) => acc + w.syllables.reduce((sAcc, s) => sAcc + s.chunks.filter(c => c.isTarget).length, 0), 0);
        if (totalTargets > 0 && Object.keys(placedLetters).length === totalTargets) {
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
                <div className="absolute inset-0 z-[110] bg-slate-100 flex flex-col items-center justify-center p-6 bg-opacity-95">
                    <EmptyStateMessage
                        onClose={() => setMode('vowels')}
                        IconComponent={Icons.LetterMarkerInstruction}
                        title="Bitte markiere zuerst Buchstaben im Text!"
                        firstStepText="Buchstaben-Symbol anklicken!"
                        secondStepText="Buchstaben markieren."
                    />
                </div>
            )}

            {showReward && (
                <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alle Lücken gefüllt! Toll!
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

            <div className="bg-white px-6 py-4 shadow-sm flex flex-wrap gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {isInitialSound ? <Icons.InitialSound className="text-blue-600" /> : <Icons.GapWords className="text-blue-600" />}
                        {title || (isInitialSound ? 'Anfangsbuchstaben finden' : 'Lückenwörter')}
                    </h2>
                    {/* Numeric Progress Indicator */}
                    <div className="flex items-center gap-1 ml-4 overflow-x-auto max-w-[400px] no-scrollbar">
                        {groups.map((_, i) => (
                            <div
                                key={i}
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0
                                    ${i === currentGroupIdx
                                        ? 'bg-blue-600 text-white scale-110 shadow-md'
                                        : i < currentGroupIdx
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-300'
                                    }
                                `}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {!isInitialSound && (
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setMode('marked')}
                            className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all font-bold text-sm mr-1 ${mode === 'marked' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icons.LetterMarker size={20} />
                            <span className="hidden sm:inline">markiert</span>
                        </button>
                        <div className="w-px bg-slate-300 my-2 mx-1"></div>
                        <button
                            onClick={() => setMode('vowels')}
                            className={`px-2 py-2 rounded-lg font-bold text-base transition-all ${mode === 'vowels' ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Vokale
                        </button>
                        <button
                            onClick={() => setMode('consonants')}
                            className={`px-2 py-2 rounded-lg font-bold text-base transition-all ${mode === 'consonants' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Konsonanten
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 ml-auto">
                    {/* Words Count Control */}
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                        <HorizontalLines count={2} />
                        <button onClick={() => handleWordsCountChange(-1)} disabled={pendingWordsCount <= 2} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                {pendingWordsCount}
                            </span>
                        </div>
                        <button onClick={() => handleWordsCountChange(1)} disabled={pendingWordsCount >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="24" max="100" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-2 bg-white border-b border-slate-200">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(groups.length > 0 ? ((currentGroupIdx + 1) / groups.length) * 100 : 0)}%` }}
                    ></div>
                </div>
            </div>

            <div className={`flex-1 flex overflow-hidden bg-white/50 ${isInitialSound ? 'flex flex-row-reverse' : ''}`}>
                {/* Fixed Layout: Centering wrapper that allows proper scrolling without top-clipping - CHANGED: justify-start and more padding */}
                {/* Content Column - Scrolls independently */}
                <div className="flex-1 overflow-y-auto custom-scroll min-h-full pt-24 pb-24 px-8 flex flex-col items-center justify-start gap-12">
                    <div className="w-full max-w-4xl space-y-8">
                        {currentWords.map((word) => {
                            const isSolved = solvedWordIds.has(word.id);
                            return (
                                <div key={word.id} className={`p-8 bg-white rounded-3xl border shadow-sm flex flex-wrap justify-center items-center gap-x-4 gap-y-4 transition-all duration-500 transform relative ${isSolved ? 'border-green-300 bg-green-50/50 scale-[1.01] shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex flex-wrap justify-center gap-x-1 gap-y-4">
                                        {word.syllables.map((syl, sIdx) => {
                                            const isEven = sIdx % 2 === 0;
                                            let styleClass = "";
                                            let textClass = "";
                                            if (settings.visualType === 'block') {
                                                styleClass = isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50';
                                                styleClass += " border rounded px-1.5 py-0.5 mx-[1px] shadow-sm";
                                            } else if (settings.visualType === 'black_gray') {
                                                textClass = isEven ? "text-slate-800" : "text-slate-400";
                                            } else {
                                                textClass = isEven ? "text-blue-700" : "text-red-600";
                                            }

                                            return (
                                                <div key={sIdx} className={`relative flex items-center ${styleClass}`} style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                                                    {syl.chunks.map((chunk) => {
                                                        const isVowelChunk = [...chunk.text.toLowerCase()].some(isVowel);
                                                        const showYellowStatic = (mode === 'consonants' || isInitialSound) && isVowelChunk;

                                                        if (!chunk.isTarget) return (
                                                            <span
                                                                key={chunk.id}
                                                                className={`font-bold ${textClass} ${showYellowStatic ? 'bg-yellow-100 shadow-border-yellow text-slate-900 mx-px px-0.5 rounded-sm' : ''}`}
                                                            >
                                                                {chunk.text}
                                                            </span>
                                                        );
                                                        const placed = placedLetters[chunk.id];
                                                        // showYellowStyle logic:
                                                        // 1. In vowels mode: only when placed (BUT NOT in isInitialSound mode)
                                                        // 2. In consonants mode: always for vowels as hints
                                                        // 3. In initial sound mode: if placed and is a vowel
                                                        const showYellowStyle = (!isInitialSound && mode === 'vowels' && placed) || (mode === 'consonants' && isVowelChunk) || (isInitialSound && placed && isVowelChunk);

                                                        return (
                                                            <div
                                                                key={chunk.id}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target'); }}
                                                                onDragLeave={(e) => { e.currentTarget.classList.remove('active-target'); }}
                                                                onDrop={(e) => { e.currentTarget.classList.remove('active-target'); handleDrop(e, chunk.id, chunk.text); }}
                                                                onClick={() => handleGapClick(chunk.id, chunk.text)}
                                                                className={`relative flex items-center justify-center transition-all border-b-4 mx-2 rounded-t-xl gap-zone cursor-pointer ${placed ? 'border-transparent' : 'border-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-500'} ${selectedLetter ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''}`}
                                                                style={{ minWidth: `${Math.max(1.2, chunk.text.length * 0.9)}em`, height: '1.75em' }}
                                                            >
                                                                {placed ? (
                                                                    <div
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, placed, 'gap', chunk.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                        className={`font-bold transition-all px-1 rounded-sm cursor-grab active:cursor-grabbing animate-[popIn_0.3s_ease-out] touch-none touch-manipulation select-none ${showYellowStyle ? 'bg-yellow-100 shadow-border-yellow text-slate-900 mx-px' : 'text-blue-600'}`}
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
                                                        <svg className="absolute -bottom-1 left-0 w-full h-2 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M 5 5 Q 50 20 95 5" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="10" strokeLinecap="round" /></svg>
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
                        <div className="mt-8 flex flex-col items-center">
                            <span className="text-green-600 font-bold mb-3 flex items-center gap-2 text-xl"><Icons.CheckCircle size={28} /> Prima!</span>
                            <button onClick={() => { setCurrentGroupIdx(prev => prev + 1); setGroupSolved(false); }} className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2 text-lg">
                                weiter <Icons.ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className={`${isInitialSound ? 'w-[200px]' : 'w-[30%]'} h-full flex flex-col bg-slate-200/50 border-l border-r border-slate-300 shadow-inner z-20`} onDragOver={(e) => e.preventDefault()} onDrop={handlePoolDrop}>
                    <div className="p-4 bg-white/80 border-b border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider text-[10px]">Pool</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{poolLetters.length}</span>
                        </div>

                    </div>
                    <div className="flex-1 relative overflow-y-auto custom-scroll p-4 flex flex-wrap content-start justify-center gap-3">
                        {poolLetters.map((l) => {
                            const isVowelTile = [...l.text.toLowerCase()].some(isVowel);
                            return (
                                <div
                                    key={l.poolId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, l, 'pool')}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handlePoolLetterClick(l)}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className={`border-2 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-center p-3 cursor-grab active:cursor-grabbing hover:scale-110 bg-white border-slate-300 shadow-[0_4px_0_0_#cbd5e1] hover:shadow-[0_2px_0_0_#cbd5e1] hover:translate-y-[2px] draggable-piece ${isVowelTile ? 'bg-yellow-100 border-yellow-400' : ''} ${selectedLetter?.poolId === l.poolId ? 'selected-piece ring-4 ring-blue-500 !scale-110 z-50' : ''}`}
                                    style={{ fontSize: `${Math.max(20, settings.fontSize * 0.8)}px`, fontFamily: settings.fontFamily, minWidth: '3.5rem' }}
                                >
                                    {l.text}
                                </div>
                            );
                        })}
                        {poolLetters.length === 0 && !groupSolved && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-400 italic text-sm pointer-events-none">Prüfe deine Antworten...</div>}
                    </div>
                </div>
            </div>
        </div >
    );
};
