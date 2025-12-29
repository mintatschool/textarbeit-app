import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    RotateCcw,
    Volume2,
    CheckCircle2,
    ChevronRight,
    Minus,
    Plus,
    Smile,
    AlertCircle
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { PUZZLE_PATH_LEFT, PUZZLE_PATH_RIGHT } from './puzzleConstants';
import { speak } from '../utils/speech';

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

    // Refined paths with larger noses/holes and taller bodies - exactly same height
    const LARGE_PUZZLE_LEFT = "M 0,20 Q 0,0 20,0 H 120 Q 140,0 140,20 V 45 C 190,30 190,120 140,105 V 130 Q 140,150 120,150 H 20 Q 0,150 0,130 Z";
    const LARGE_PUZZLE_RIGHT = "M 30,20 Q 30,0 50,0 H 200 Q 220,0 220,20 V 130 Q 220,150 200,150 H 50 Q 30,150 30,130 V 105 C 80,120 80,30 30,45 Z";

    // Adjusting translate for the right piece based on larger width/nose
    const rightTranslate = 140;

    return (
        <svg width="60" height="35" viewBox="0 0 420 180" className="overflow-visible transition-all duration-300">
            <path
                d={LARGE_PUZZLE_LEFT}
                fill={fillLeft}
                stroke={strokeColor}
                strokeWidth="24"
                className="transition-colors duration-300"
            />
            <path
                d={LARGE_PUZZLE_RIGHT}
                fill={fillRight}
                stroke={strokeColor}
                strokeWidth="24"
                transform={`translate(${rightTranslate}, 0)`}
                className="transition-colors duration-300"
            />
        </svg>
    );
};

export const PuzzleTestTwoSyllableView = ({ words, settings, onClose, title }) => {
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: settings.pieceScale || 1.0,
        wordsPerStage: 3,
        gameMode: 'both-empty'
    });

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);

    const [scrambledSyllables, setScrambledSyllables] = useState([]);
    const [placedSyllables, setPlacedSyllables] = useState({ left: null, right: null });
    const [isDragging, setIsDragging] = useState(null);
    const [showWordSuccess, setShowWordSuccess] = useState(false);

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

    const startNewGame = useCallback((customWordsPerStage) => {
        const wps = customWordsPerStage !== undefined ? customWordsPerStage : pendingWordsCount;
        setGameState(prev => ({ ...prev, gameStatus: 'loading', stages: [], currentStageIndex: 0, wordsPerStage: wps }));

        if (!words || words.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
            return;
        }

        // Filter for exactly 2 syllables
        let validWords = words.filter(w => w.syllables && w.syllables.length === 2 && w.syllables.every(s => s));

        if (validWords.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [] }));
            return;
        }

        // Shuffle words
        let shuffled = [...validWords].sort(() => Math.random() - 0.5);

        const newStages = [];
        for (let i = 0; i < shuffled.length; i += wps) {
            const stageWords = shuffled.slice(i, i + wps);
            const mappedWords = stageWords.map(w => ({
                fullWord: w.word,
                syllables: w.syllables
            }));

            if (stageWords.length > 0) {
                newStages.push({ words: mappedWords, completedWordIndices: [], targetWordIndex: 0 });
            }
        }

        setGameState(prev => ({ ...prev, stages: newStages, gameStatus: 'playing', currentStageIndex: 0, wordsPerStage: wps }));

    }, [pendingWordsCount, words]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const setupCurrentWord = useCallback(() => {
        if (gameState.gameStatus !== 'playing' || gameState.stages.length === 0) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];
        if (!currentStage) return;
        const targetWordIdx = currentStage.targetWordIndex ?? 0;
        const currentWord = currentStage.words[targetWordIdx];
        if (!currentWord) return;

        setPlacedSyllables({
            left: gameState.gameMode === 'left-filled' ? currentWord.syllables[0] : null,
            right: gameState.gameMode === 'right-filled' ? currentWord.syllables[1] : null
        });

        const leftPieces = [];
        const rightPieces = [];

        currentStage.words.forEach((word, wordIdx) => {
            if (currentStage.completedWordIndices.includes(wordIdx)) return;
            word.syllables.forEach((text, sylIdx) => {
                const isLeft = sylIdx === 0;
                if (wordIdx === targetWordIdx) {
                    if (isLeft && gameState.gameMode === 'left-filled') return;
                    if (!isLeft && gameState.gameMode === 'right-filled') return;
                }
                const piece = {
                    id: `syl-${wordIdx}-${sylIdx}-${Math.random()}`,
                    text,
                    type: isLeft ? 'left' : 'right',
                    color: 'bg-blue-500', // Force BLUE
                    wordIdx,
                    // No x/y needed for vertical stack, just sort order
                    sortIndex: Math.random()
                };
                if (isLeft) leftPieces.push(piece);
                else rightPieces.push(piece);
            });
        });

        const allPieces = [...leftPieces, ...rightPieces].sort((a, b) => a.sortIndex - b.sortIndex);
        setScrambledSyllables(allPieces);
    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.stages, gameState.gameMode, gameState.wordsPerStage]);

    useEffect(() => {
        setupCurrentWord();
    }, [gameState.currentStageIndex, gameState.gameStatus, gameState.gameMode, setupCurrentWord]);

    const handleDrop = (targetType) => {
        if (isDragging === null || showWordSuccess) return;
        const draggingSyllable = scrambledSyllables.find(s => s.id === isDragging);
        if (!draggingSyllable) return;

        if (draggingSyllable.type !== targetType) return;

        setPlacedSyllables(prev => ({
            ...prev,
            [targetType]: draggingSyllable.text
        }));

        setScrambledSyllables(prev => prev.filter(s => s.id !== isDragging));
        setIsDragging(null);
    };

    const removePieceFromSlot = (type) => {
        if (showWordSuccess) return;
        const text = placedSyllables[type];
        if (!text) return;

        setPlacedSyllables(prev => ({
            ...prev,
            [type]: null
        }));

        // Add back to scrambled
        const newPiece = {
            id: `syl-return-${Math.random()}`,
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
            const formedWord = placedSyllables.left + placedSyllables.right;
            const currentStage = gameState.stages[gameState.currentStageIndex];
            const targetWordIdx = currentStage.targetWordIndex ?? 0;
            const targetWord = currentStage.words[targetWordIdx];

            if (targetWord && targetWord.syllables.join('') === formedWord) {
                // speak(targetWord.fullWord); // Auto-audio disabled
                setShowWordSuccess(true);

                setTimeout(() => {
                    setShowWordSuccess(false);
                    setPlacedSyllables({ left: null, right: null });

                    const nextWordIdx = targetWordIdx + 1;
                    setGameState(prev => {
                        const newStages = prev.stages.map((stage, idx) => {
                            if (idx === prev.currentStageIndex) {
                                return {
                                    ...stage,
                                    completedWordIndices: [...stage.completedWordIndices, targetWordIdx],
                                    targetWordIndex: nextWordIdx < prev.wordsPerStage ? nextWordIdx : stage.targetWordIndex
                                };
                            }
                            return stage;
                        });
                        const isStageFinished = nextWordIdx >= prev.wordsPerStage;
                        return { ...prev, stages: newStages, gameStatus: isStageFinished ? 'stage-complete' : 'playing' };
                    });
                }, 2500);
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

    if (gameState.gameStatus === 'loading') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-50">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold text-blue-900 animate-pulse">Wörter werden vorbereitet...</p>
            </div>
        );
    }

    const currentStageInfo = gameState.stages[gameState.currentStageIndex];

    // If no words available
    if (gameState.stages.length === 0 && gameState.gameStatus === 'playing') {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine passenden Wörter gefunden.</h2>
                <p className="text-slate-600 mb-6">Bitte markiere Wörter mit genau 2 Silben.</p>

                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Zurück</button>
            </div>
        );
    }

    if (!currentStageInfo && gameState.gameStatus === 'playing') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-900 mb-2">Fehler beim Laden.</h2>
                <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Nochmal versuchen</button>
            </div>
        );
    }

    const currentTargetIdx = currentStageInfo?.targetWordIndex ?? 0;

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            <header className="bg-white border-b-2 border-blue-100 px-6 py-3 flex justify-between items-center z-20 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 mr-4">
                        <Icons.SyllableTestTwo className="text-blue-600 w-8 h-8" />
                        <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenpuzzle 1"}</span>
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
                                title={m === 'both-empty' ? 'Beide Silben finden' : m === 'left-filled' ? 'Zweite Silbe finden' : 'Erste Silbe finden'}
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

                    <button onClick={() => window.confirm("Neu starten?") && startNewGame()} className="p-2 text-gray-400 hover:text-blue-500 transition-colors mr-2">
                        <RotateCcw className="w-6 h-6" />
                    </button>

                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            <main className="flex-1 relative flex overflow-hidden">
                {/* Links - Vertical Scroll Stack */}
                <div className="w-1/4 relative border-r border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar py-6 space-y-8 flex flex-col items-center">
                    {scrambledSyllables.filter(s => s.type === 'left').map(s => (
                        <div key={s.id} className="transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing" style={{ zIndex: isDragging === s.id ? 100 : 10 }}>
                            <PuzzleTestPiece label={s.text} type="left" colorClass={s.color} scale={gameState.pieceScale} onDragStart={(e) => { setIsDragging(s.id); }} onDragEnd={() => setIsDragging(null)} isDragging={isDragging === s.id} fontFamily={settings.fontFamily} />
                        </div>
                    ))}
                </div>

                {/* Zentrum */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
                    <button
                        onClick={() => currentStageInfo?.words[currentTargetIdx] && speak(currentStageInfo.words[currentTargetIdx].fullWord)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 mb-10 shrink-0"
                    >
                        <Volume2 className="w-7 h-7" />
                    </button>

                    {/* Target Container - Standardized Flex Layout with Overlap */}
                    <div className="relative flex flex-col items-center gap-4 w-full mt-6">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">2 Silben</span>

                        <div className={`
                            relative flex items-center justify-center transition-all duration-500 py-8
                            ${showWordSuccess ? 'scale-105' : ''}
                        `}>
                            <div className="flex items-center">
                                {['left', 'right'].map((type, idx) => {
                                    const pieceText = placedSyllables[type];
                                    const scale = gameState.pieceScale;
                                    const base = 200;
                                    const overlap = 25 * scale; // Standard overlap

                                    return (
                                        <div
                                            key={type}
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
                                                handleDrop(type);
                                            }}
                                        >
                                            {/* TRANSPARENT HIT AREA for better tolerance */}
                                            <div className="absolute inset-[-20px] z-0" />

                                            {/* Empty Slot Ghost */}
                                            {!pieceText && (
                                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                    <PuzzleTestPiece
                                                        label=""
                                                        type={type}
                                                        isGhost={true}
                                                        scale={scale}
                                                        fontFamily={settings.fontFamily}
                                                    />
                                                </div>
                                            )}

                                            {/* Filled Slot */}
                                            {pieceText && (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => removePieceFromSlot(type)}
                                                >
                                                    <PuzzleTestPiece
                                                        label={pieceText}
                                                        type={type}
                                                        colorClass="bg-blue-500"
                                                        scale={scale}
                                                        showSeamLine={true}
                                                        fontFamily={settings.fontFamily}
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
                                <CheckCircle2 className="text-green-500 drop-shadow-2xl" style={{ width: `${80 * gameState.pieceScale}px`, height: `${80 * gameState.pieceScale}px` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rechts - Vertical Scroll Stack */}
                <div className="w-1/4 relative border-l border-blue-50 bg-white/20 shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar py-6 space-y-8 flex flex-col items-center">
                    {scrambledSyllables.filter(s => s.type === 'right').map(s => (
                        <div key={s.id} className="transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing" style={{ zIndex: isDragging === s.id ? 100 : 10 }}>
                            <PuzzleTestPiece label={s.text} type="right" colorClass={s.color} scale={gameState.pieceScale} onDragStart={() => setIsDragging(s.id)} onDragEnd={() => setIsDragging(null)} isDragging={isDragging === s.id} fontFamily={settings.fontFamily} />
                        </div>
                    ))}
                </div>
            </main>

            {gameState.gameStatus === 'stage-complete' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300 relative overflow-hidden">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Super!</h2>
                        <p className="text-slate-500 mb-8 font-medium">Level geschafft.</p>
                        <button onClick={() => setGameState(prev => {
                            if (prev.currentStageIndex >= prev.stages.length - 1) {
                                return { ...prev, currentStageIndex: 0, gameStatus: 'playing' };
                            }
                            return { ...prev, currentStageIndex: prev.currentStageIndex + 1, gameStatus: 'playing' }
                        })} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg relative z-10">
                            Weiter <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                    {/* Confetti */}
                    <div className="fixed inset-0 pointer-events-none z-[60]">
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
        </div>
    );
};
