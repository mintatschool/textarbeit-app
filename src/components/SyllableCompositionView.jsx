import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    RotateCcw,
    Volume2,
    CheckCircle2,
    Maximize2,
    Minus,
    Plus,
    AlertCircle
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';
import availableSyllables from '../utils/available_syllables.json';

const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-4 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

const ModeIcon = ({ mode, active }) => {
    const primaryColor = active ? '#3b82f6' : '#94a3b8';
    const strokeColor = active ? '#2563eb' : '#cbd5e1';
    const fillLeft = mode === 'left-filled' ? primaryColor : 'none';
    const fillRight = mode === 'right-filled' ? primaryColor : 'none';

    // Simplified Arrow/Chevron for Icon
    const ICON_ARROW_LEFT = "M 0,20 Q 0,0 20,0 H 120 L 150,75 L 120,150 H 20 Q 0,150 0,130 Z";
    const ICON_ARROW_RIGHT = "M 152,0 L 182,75 L 152,150 H 280 Q 300,150 300,130 V 20 Q 300,0 280,0 H 152 Z";

    return (
        <svg width="60" height="35" viewBox="0 0 300 150" className="overflow-visible transition-all duration-300">
            <path
                d={ICON_ARROW_LEFT}
                fill={fillLeft}
                stroke={strokeColor}
                strokeWidth="20"
                transform="scale(0.8)"
                className="transition-colors duration-300"
            />
            <path
                d={ICON_ARROW_RIGHT}
                fill={fillRight}
                stroke={strokeColor}
                strokeWidth="20"
                transform="scale(0.8) translate(10,0)" // Gap
                className="transition-colors duration-300"
            />
        </svg>
    );
};

export const SyllableCompositionView = ({ onClose, settings = {}, words = [], title }) => {
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 1.0,
        wordsPerStage: 3,
        gameMode: 'both-empty'
    });

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);

    const [scrambledSyllables, setScrambledSyllables] = useState([]);
    const [placedSyllables, setPlacedSyllables] = useState({ left: null, right: null });
    const [isDragging, setIsDragging] = useState(null);
    const [showWordSuccess, setShowWordSuccess] = useState(false);

    // Syllable Logic
    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);
    const isCluster = (str) => allowedClusters.has(str);


    // Filter valid syllables from MARKED WORDS
    const validSyllables = useMemo(() => {
        // Strict requirement: Audio list must be loaded
        if (!availableSyllables) return [];

        let audioSet = new Set();
        try {
            const raw = (availableSyllables && Array.isArray(availableSyllables) ? availableSyllables : (availableSyllables?.default || []));
            if (Array.isArray(raw)) {
                audioSet = new Set(raw.map(s => (s && typeof s === 'string') ? s.toLowerCase().trim() : ''));
            }
        } catch (e) {
            console.warn("Syllable audio list error", e);
            return []; // Fail safe if audio list is corrupted
        }

        const valid = [];
        const seen = new Set();

        // 1. Extract syllables from words
        let candidateSyllables = [];
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w && Array.isArray(w.syllables)) {
                    w.syllables.forEach(s => {
                        if (typeof s === 'string') candidateSyllables.push(s);
                    });
                } else if (w && w.word) {
                    // Fallback to word itself if no syllables defined (should be rare for "Syllables")
                    candidateSyllables.push(w.word);
                }
            });
        }

        // 2. Filter loop
        candidateSyllables.forEach(syl => {
            if (!syl || typeof syl !== 'string') return;
            const cleanSyl = syl.toLowerCase().trim();
            if (cleanSyl.length < 2) return;
            if (seen.has(cleanSyl)) return;

            // STRICT RULE 1: Must have audio
            if (!audioSet.has(cleanSyl)) return;

            // STRICT RULE 2: Must consist of (Letter/Cluster) + (Letter/Cluster)
            // We search for *strictly* valid splits.
            let foundSplit = null;

            for (let i = 1; i < cleanSyl.length; i++) {
                const partA = cleanSyl.substring(0, i);
                const partB = cleanSyl.substring(i);

                // Validation Logic
                const isPartAValid = partA.length === 1 || allowedClusters.has(partA);
                const isPartBValid = partB.length === 1 || allowedClusters.has(partB);

                if (isPartAValid && isPartBValid) {
                    foundSplit = { partA, partB, full: cleanSyl };
                    break; // Found a valid structure
                }
            }

            // Unlike before, we DO NOT have a fallback. 
            // If it doesn't split into valid parts, it is excluded.

            if (foundSplit) {
                valid.push(foundSplit);
                seen.add(cleanSyl);
            }
        });

        console.log("SyllableCompositionView: Strict filtered syllables", valid);
        return valid.sort(() => Math.random() - 0.5);
    }, [words, settings?.clusters, allowedClusters]);




    const startNewGame = useCallback((customWordsPerStage) => {
        const wps = customWordsPerStage !== undefined ? customWordsPerStage : pendingWordsCount;
        setGameState(prev => ({ ...prev, gameStatus: 'loading', stages: [], currentStageIndex: 0, wordsPerStage: wps }));

        if (validSyllables.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
            return;
        }

        // Shuffle
        let shuffled = [...validSyllables].sort(() => Math.random() - 0.5);

        const newStages = [];
        for (let i = 0; i < shuffled.length; i += wps) {
            const stageItems = shuffled.slice(i, i + wps);

            if (stageItems.length > 0) {
                newStages.push({ items: stageItems, completedWordIndices: [], targetWordIndex: 0 });
            }
        }

        setGameState(prev => ({ ...prev, stages: newStages, gameStatus: 'playing', currentStageIndex: 0, wordsPerStage: wps }));

    }, [pendingWordsCount, validSyllables]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const setupCurrentWord = useCallback(() => {
        if (gameState.gameStatus !== 'playing' || gameState.stages.length === 0) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage) return;
        const targetIdx = currentStage.targetWordIndex ?? 0;
        const currentItem = currentStage.items[targetIdx];
        if (!currentItem) return;

        setPlacedSyllables({
            left: gameState.gameMode === 'left-filled' ? currentItem.partA : null,
            right: gameState.gameMode === 'right-filled' ? currentItem.partB : null
        });

        const leftPieces = [];
        const rightPieces = [];

        currentStage.items.forEach((item, idx) => {
            if (currentStage.completedWordIndices.includes(idx)) return;

            // Left Part
            if (!(idx === targetIdx && gameState.gameMode === 'left-filled')) {
                leftPieces.push({
                    id: `partA-${idx}`, // Stable ID
                    text: item.partA,
                    type: 'zigzag-left', // Visual Type: Arrow Left
                    color: 'bg-blue-500',
                    wordIdx: idx,
                    sortIndex: idx * 0.137 // Deterministic shuffle per stage based on setup
                });
            }

            // Right Part
            if (!(idx === targetIdx && gameState.gameMode === 'right-filled')) {
                rightPieces.push({
                    id: `partB-${idx}`, // Stable ID
                    text: item.partB,
                    type: 'zigzag-right', // Visual Type: Arrow Right
                    color: 'bg-blue-500',
                    wordIdx: idx,
                    sortIndex: idx * 0.731 // Deterministic shuffle per stage based on setup
                });
            }
        });

        // We still want some randomness, but STABLE throughout the stage.
        // We can use the currentStageIndex as a seed if needed, but simple idx-based shift is fine for now.
        const allPieces = [...leftPieces, ...rightPieces].sort((a, b) => {
            // Pseudo-random sort based on text and index to stay stable
            const textA = a.text || "";
            const textB = b.text || "";
            const sumA = textA.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (a.wordIdx || 0);
            const sumB = textB.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (b.wordIdx || 0);
            return (sumA % 7) - (sumB % 7) || (a.id || "").localeCompare(b.id || "");
        });
        setScrambledSyllables(allPieces);

    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.stages, gameState.gameMode, gameState.wordsPerStage]);

    useEffect(() => {
        setupCurrentWord();
    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.gameMode, setupCurrentWord]);

    const handleDrop = (targetType) => {
        if (isDragging === null || showWordSuccess) return;
        const draggingPiece = scrambledSyllables.find(s => s.id === isDragging);
        if (!draggingPiece) return;

        // targetType matches the role ('left' or 'right')
        // draggingPiece.type is 'zigzag-left' or 'zigzag-right'

        const validMatch = (targetType === 'left' && draggingPiece.type === 'zigzag-left') ||
            (targetType === 'right' && draggingPiece.type === 'zigzag-right');

        if (!validMatch) return;

        setPlacedSyllables(prev => ({
            ...prev,
            [targetType]: draggingPiece.text
        }));

        setScrambledSyllables(prev => prev.filter(s => s.id !== isDragging));
        setIsDragging(null);
    };

    const removePieceFromSlot = (role) => {
        if (showWordSuccess) return;
        const text = placedSyllables[role];
        if (!text) return;

        setPlacedSyllables(prev => ({
            ...prev,
            [role]: null
        }));

        // Add back to scrambled
        const type = role === 'left' ? 'zigzag-left' : 'zigzag-right';
        const newPiece = {
            id: `return-${Math.random()}`,
            text,
            type,
            color: 'bg-blue-500',
            sortIndex: Math.random()
        };
        setScrambledSyllables(prev => [...prev, newPiece]);
    };

    useEffect(() => {
        if (showWordSuccess) return;
        if (placedSyllables.left && placedSyllables.right) {
            const formedSyllable = placedSyllables.left + placedSyllables.right;
            const currentStage = gameState.stages[gameState.currentStageIndex];
            const targetIdx = currentStage.targetWordIndex ?? 0;
            const targetItem = currentStage.items[targetIdx];

            // Wait, we need to check if the combination creates a valid syllable from the LIST?
            // Or only if it matches the EXPECTED target item?
            // In PuzzleTestTwoSyllable, it checks validity against dictionary. 
            // HERE, we are "composing" a specific target item?
            // "Syllable Composition" suggests building a valid syllable.
            // If I dragged "fa" (left) and "hr" (right) -> "fahhr"? No.
            // But if I have multiple options on screen.
            // E.g. Target is "schu". Options: "sch", "f" (left); "u", "a" (right).
            // User drags "sch" + "u". Match!
            // User drags "sch" + "a" -> "scha". Is "scha" valid? Yes.
            // BUT is it the *target*?
            // Creating a "game" usually implies a target.
            // My filtering logic picks specific items for the stage.
            // In `PuzzleTestTwoSyllableView`: "targetWordIndex" implies sequential targets.
            // However, typically users can solve any valid word on standard puzzle.
            // For syllable composition, let's assume strict target for simplicity, OR Dictionary check.
            // "targetItem.full === formedSyllable" implies strict target sequence.
            // Let's stick to that for now, as audio playback needs the word ID/file.

            if (targetItem && targetItem.full === formedSyllable) {
                speak(targetItem.full);
                setShowWordSuccess(true);

                setTimeout(() => {
                    setShowWordSuccess(false);
                    setPlacedSyllables({ left: null, right: null });

                    const nextIdx = targetIdx + 1;
                    setGameState(prev => {
                        const currentStage = prev.stages[prev.currentStageIndex];
                        const currentStageItemsCount = currentStage?.items?.length || prev.wordsPerStage;
                        const newStages = prev.stages.map((stage, idx) => {
                            if (idx === prev.currentStageIndex) {
                                return {
                                    ...stage,
                                    completedWordIndices: [...stage.completedWordIndices, targetIdx],
                                    targetWordIndex: nextIdx < currentStageItemsCount ? nextIdx : stage.targetWordIndex
                                };
                            }
                            return stage;
                        });
                        const isStageFinished = nextIdx >= currentStageItemsCount;
                        return { ...prev, stages: newStages, gameStatus: isStageFinished ? 'stage-complete' : 'playing' };
                    });
                }, 2000);
            }
        }
    }, [placedSyllables, gameState.currentStageIndex, gameState.stages, gameState.wordsPerStage, showWordSuccess]);

    const handleUpdateWordsCount = (delta) => {
        const nextValue = Math.max(2, Math.min(8, pendingWordsCount + delta));
        if (nextValue === pendingWordsCount) return;
        setPendingWordsCount(nextValue);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = window.setTimeout(() => {
            startNewGame(nextValue);
            debounceTimerRef.current = null;
        }, 1200);
    };

    const handleModeChange = (mode) => {
        setGameState(prev => ({ ...prev, gameMode: mode }));
    };

    // Auto-close after completion
    useEffect(() => {
        if (gameState.gameStatus === 'stage-complete') {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gameState.gameStatus, onClose]);


    if (gameState.gameStatus === 'loading') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-50">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold text-blue-900 animate-pulse">Übung wird geladen...</p>
            </div>
        );
    }

    const currentStageInfo = gameState.stages[gameState.currentStageIndex];

    if (!currentStageInfo && gameState.gameStatus === 'playing') {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine passenden Silben gefunden.</h2>
                <p className="text-slate-600 mb-6">Bitte markiere Wörter, deren Silben sich in (Buchstabe/Cluster) + (Buchstabe/Cluster) zerlegen lassen.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Zurück</button>
            </div>
        );
    }



    // Stage completion view
    if (gameState.gameStatus === 'stage-complete') {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Super!</h2>
                <p className="text-slate-600 mb-8">Du hast alle Silben gebaut.</p>
                <div className="flex gap-4">
                    <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <RotateCcw size={20} /> Noch einmal
                    </button>
                    <button onClick={onClose} className="bg-emerald-100 text-emerald-700 px-8 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-200 transition-colors border border-emerald-200">
                        Beenden
                    </button>
                </div>
            </div>
        );
    }

    const currentTargetIdx = currentStageInfo?.targetWordIndex ?? 0;

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            <header className="bg-white border-b-2 border-blue-100 px-6 py-3 flex justify-between items-center z-20 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 mr-4">
                        <Icons.PuzzleZigzag className="text-blue-600 w-8 h-8" />
                        <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenbau 1"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {gameState.stages.map((_, idx) => (
                            <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${gameState.currentStageIndex === idx ? 'bg-blue-600 text-white scale-110 shadow-md' : idx < gameState.currentStageIndex ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-[1.25rem] border border-slate-200 hidden md:flex">
                        {['both-empty', 'left-filled', 'right-filled'].map((m) => (
                            <button
                                key={m}
                                onClick={() => handleModeChange(m)}
                                className={`
                  relative px-3 py-1.5 rounded-xl transition-all duration-300 
                  ${gameState.gameMode === m
                                        ? 'bg-white shadow-lg scale-105 border border-blue-100'
                                        : 'hover:bg-white/50 border border-transparent'}
                  active:scale-95
                `}
                                title={m === 'both-empty' ? 'Beide Teile finden' : m === 'left-filled' ? 'Zweiten Teil finden' : 'Ersten Teil finden'}
                            >
                                <div className="transform scale-75 origin-center">
                                    <ModeIcon mode={m} active={gameState.gameMode === m} />
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                        <HorizontalLines count={2} />
                        <button onClick={() => handleUpdateWordsCount(-1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1" disabled={pendingWordsCount <= 2}>
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                {pendingWordsCount}
                            </span>
                        </div>
                        <button onClick={() => handleUpdateWordsCount(1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1" disabled={pendingWordsCount >= 8}>
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="0.7"
                            max="1.3"
                            step="0.1"
                            value={gameState.pieceScale}
                            onChange={(e) => setGameState(prev => ({ ...prev, pieceScale: parseFloat(e.target.value) }))}
                            className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>

                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm ml-2">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            <main className="flex-1 relative flex overflow-hidden">
                {/* Links */}
                <div className="w-1/4 relative border-r border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar py-6 space-y-8 flex flex-col items-center">
                    {scrambledSyllables.filter(s => s.type === 'zigzag-left').map(s => (
                        <div key={s.id} className="transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing" style={{ zIndex: isDragging === s.id ? 100 : 10 }}>
                            <PuzzleTestPiece
                                label={s.text}
                                type="zigzag-left"
                                colorClass={s.color}
                                scale={gameState.pieceScale}
                                onDragStart={(e) => { setIsDragging(s.id); }}
                                isDragging={isDragging === s.id}
                            />
                        </div>
                    ))}
                </div>

                {/* Zentrum */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
                    <button
                        onClick={() => currentStageInfo?.items[currentTargetIdx] && speak(currentStageInfo.items[currentTargetIdx].full)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 mb-14 shrink-0"
                        title="Anhören"
                    >
                        <Volume2 className="w-7 h-7" />
                    </button>

                    <div className="relative flex flex-col items-center gap-4 w-full mt-6">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Silbe bauen</span>

                        <div className={`
                            relative flex items-center justify-center transition-all duration-500 py-8
                            ${showWordSuccess ? 'scale-105' : ''}
                        `}>
                            <div className="flex items-center">
                                {['left', 'right'].map((role, idx) => {
                                    const pieceText = placedSyllables[role];
                                    const scale = gameState.pieceScale;
                                    const overlap = 30 * scale;
                                    const typeName = role === 'left' ? 'zigzag-left' : 'zigzag-right';

                                    return (
                                        <div
                                            key={role}
                                            className="relative flex items-center justify-center transition-all duration-300 group overflow-visible"
                                            style={{
                                                width: `${200 * scale}px`,
                                                height: `${110 * scale}px`,
                                                marginLeft: idx === 0 ? 0 : `-${overlap}px`,
                                                zIndex: idx === 0 ? 2 : 1
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleDrop(role);
                                            }}
                                        >
                                            <div className="absolute inset-[-20px] z-0" />

                                            {!pieceText && (
                                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                    <PuzzleTestPiece
                                                        label=""
                                                        type={typeName}
                                                        isGhost={true}
                                                        scale={scale}
                                                    />
                                                </div>
                                            )}

                                            {pieceText && (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => removePieceFromSlot(role)}
                                                >
                                                    <PuzzleTestPiece
                                                        label={pieceText}
                                                        type={typeName}
                                                        colorClass="bg-blue-500"
                                                        scale={scale}
                                                        showSeamLine={true}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`
                                absolute transition-all duration-500 ease-out z-30 pointer-events-none
                                ${showWordSuccess ? 'scale-125 opacity-100 translate-x-12' : 'scale-0 opacity-0 translate-x-0'}
                            `} style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}>
                                <CheckCircle2 className="text-emerald-500 drop-shadow-2xl" style={{ width: `${80 * gameState.pieceScale}px`, height: `${80 * gameState.pieceScale}px` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rechts */}
                <div className="w-1/4 relative border-l border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar py-6 space-y-8 flex flex-col items-center">
                    {scrambledSyllables.filter(s => s.type === 'zigzag-right').map(s => (
                        <div key={s.id} className="transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing" style={{ zIndex: isDragging === s.id ? 100 : 10 }}>
                            <PuzzleTestPiece
                                label={s.text}
                                type="zigzag-right"
                                colorClass={s.color}
                                scale={gameState.pieceScale}
                                onDragStart={(e) => { setIsDragging(s.id); }}
                                isDragging={isDragging === s.id}
                            />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
