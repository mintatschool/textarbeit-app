import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Volume2,
    VolumeX,
    Minus,
    Plus
} from 'lucide-react';
import { Icons } from './Icons';
import { ProgressBar } from './ProgressBar';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';
import { EmptyStateMessage } from './EmptyStateMessage';

// Helper component for horizontal lines in the stepper control
const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-2 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

export const PuzzleTestMultiSyllableView = ({ words, settings, onClose, title, activeColor }) => {
    // Game State
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 1.0,
        wordsPerStage: 3
    });

    const [isDragging, setIsDragging] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null); // Tap-to-Select state
    const [pendingWordsCount, setPendingWordsCount] = useState(3);

    // Pieces & Slots State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [slots, setSlots] = useState({}); // Key: "wordId-slotIdx" -> piece
    const [completedRows, setCompletedRows] = useState({}); // Map<RowWordID, SolvedWordID>
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [highlightedWordId, setHighlightedWordId] = useState(null); // For audio hint
    const [lastSpokenWord, setLastSpokenWord] = useState(null); // Prevent repetitive speech

    const debounceTimerRef = useRef(null);
    const audioHighlightTimerRef = useRef(null);

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


    // --------------------------------------------------------------------------------
    // 1. GAME LOGIC & INITIALIZATION
    // --------------------------------------------------------------------------------

    // Start/Restart Game
    const startNewGame = useCallback((currWps) => {
        const wps = currWps !== undefined ? currWps : gameState.wordsPerStage;

        if ((!words || !Array.isArray(words) || words.length === 0) && (!gameState.stages || gameState.stages.length === 0)) {
            setGameState(prev => ({ ...prev, gameStatus: 'no_words' }));
            return;
        }

        // Filter valid words strictly
        const validWords = words
            .filter(w =>
                w.syllables &&
                w.syllables.length >= 2 &&
                w.syllables.every(s => s && typeof s === 'string')
            )
            .map(w => ({
                ...w,
                id: w.id || Math.random().toString(36).substr(2, 9)
            }));

        if (validWords.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'no_words' }));
            return;
        }

        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const stages = [];
        for (let i = 0; i < shuffled.length; i += wps) {
            const chunk = shuffled.slice(i, i + wps);
            if (chunk.length > 0) {
                stages.push({ items: chunk });
            }
        }

        setGameState(prev => ({
            ...prev,
            stages,
            currentStageIndex: 0,
            gameStatus: 'playing',
            wordsPerStage: wps
        }));

        setCompletedRows({});
        setSlots({});
        setHighlightedWordId(null);
        setLastSpokenWord(null);

    }, [words, gameState.wordsPerStage]);

    // Update pending count when wordsPerStage changes (e.g. initial load)
    useEffect(() => {
        setPendingWordsCount(gameState.wordsPerStage);
    }, [gameState.wordsPerStage]);

    // Initial Start
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);


    // --------------------------------------------------------------------------------
    // 2. STAGE SETUP (Pieces Generation)
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (gameState.gameStatus !== 'playing' || !gameState.stages[gameState.currentStageIndex]) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const newPieces = { left: [], middle: [], right: [] };

        const getPieceWidth = (text) => {
            const standardBaseWidth = 200;
            if (!text || text.length <= 5) return standardBaseWidth;
            return standardBaseWidth + ((text.length - 5) * 20);
        };

        const getMiddleGridPos = (index, total) => {
            const spacing = 90 / (total || 1);
            return {
                x: 5 + (index * spacing),
                y: 10 + (Math.random() * 20)
            };
        };

        // Generate pieces for the current stage words ONLY
        currentStage.items.forEach(word => {
            word.syllables.forEach((syl, index) => {
                const uniqueId = `${word.id}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                const width = getPieceWidth(syl);
                const piece = {
                    id: uniqueId,
                    text: syl,
                    wordId: word.id,
                    syllableIndex: index,
                    totalSyllables: word.syllables.length,
                    color: 'bg-blue-500', // Could use distinct colors per word if desired, but blue is standard here
                    rotation: (Math.random() - 0.5) * 4,
                    width: width,
                    sortIndex: Math.random()
                };

                if (index === 0) {
                    newPieces.left.push({ ...piece, type: 'left' });
                } else if (index === word.syllables.length - 1) {
                    newPieces.right.push({ ...piece, type: 'right' });
                } else {
                    newPieces.middle.push({ ...piece, type: 'middle' });
                }
            });
        });

        // Shuffle
        newPieces.left.sort((a, b) => a.sortIndex - b.sortIndex);
        newPieces.right.sort((a, b) => a.sortIndex - b.sortIndex);
        newPieces.middle.sort((a, b) => a.sortIndex - b.sortIndex);

        newPieces.middle = newPieces.middle.map((p, i) => ({
            ...p,
            ...getMiddleGridPos(i, newPieces.middle.length)
        }));

        setPieces(newPieces);
        setSlots({}); // Clear slots when stage changes
        setCompletedRows({}); // Clear completed for this stage context

    }, [gameState.currentStageIndex, gameState.stages, gameState.gameStatus]);


    // --------------------------------------------------------------------------------
    // 3. INTERACTIONS (Drop, Remove, Speak)
    // --------------------------------------------------------------------------------

    const handleDrop = (pieceId, wordId, slotIndex) => {
        // Find piece
        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(zone => {
            const p = pieces[zone].find(x => x.id === pieceId);
            if (p) { foundPiece = p; }
        });

        if (!foundPiece) return;

        // Find the target word to check its syllable count for type validation
        const currentStage = gameState.stages[gameState.currentStageIndex];
        const targetWord = currentStage.items.find(w => w.id === wordId);
        if (!targetWord) return;

        const targetLength = targetWord.syllables.length;
        // Verify piece fits slot type
        const requiredType = slotIndex === 0 ? 'left' : (slotIndex === targetLength - 1 ? 'right' : 'middle');
        if (foundPiece.type !== requiredType) return;

        // Place piece
        const slotKey = `${wordId}-${slotIndex}`;

        setSlots(prev => {
            const next = { ...prev };

            // Check if this piece is already in another slot and remove it
            const existingKey = Object.keys(next).find(k => next[k].id === foundPiece.id);
            if (existingKey) {
                delete next[existingKey];
            }

            next[slotKey] = foundPiece;
            return next;
        });
    };

    const removePieceFromSlot = (slotKey, wordId) => {
        // if (completedRows[wordId]) return; // Unlock
        setSlots(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    const handleReturnToPool = (pieceId) => {
        setSlots(prev => {
            const next = { ...prev };
            let modified = false;
            Object.keys(next).forEach(key => {
                if (next[key]?.id === pieceId) {
                    delete next[key];
                    modified = true;
                }
            });
            return modified ? next : prev;
        });
    };

    // Tap-to-Select Handlers
    const handlePieceSelect = (piece) => {
        if (!piece) {
            setSelectedPiece(null);
            return;
        }
        if (selectedPiece?.id === piece.id) {
            setSelectedPiece(null);
        } else {
            setSelectedPiece(piece);
        }
    };

    const handleSlotSelect = (wordId, slotIndex, targetWord) => {
        if (!selectedPiece) return;

        const targetLength = targetWord.syllables.length;
        const requiredType = slotIndex === 0 ? 'left' : (slotIndex === targetLength - 1 ? 'right' : 'middle');

        if (selectedPiece.type !== requiredType) {
            setSelectedPiece(null);
            return;
        }

        const slotKey = `${wordId}-${slotIndex}`;
        setSlots(prev => {
            const next = { ...prev };
            const existingKey = Object.keys(next).find(k => next[k].id === selectedPiece.id);
            if (existingKey) delete next[existingKey];
            next[slotKey] = selectedPiece;
            return next;
        });
        setSelectedPiece(null);
    };

    // --------------------------------------------------------------------------------
    // 4. VALIDATION LOOP
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStageWords = gameState.stages[gameState.currentStageIndex].items;

        currentStageWords.forEach(rowWord => {
            // Check if all slots in this row are filled
            let isFull = true;
            const rowPieces = [];
            const len = rowWord.syllables.length;

            for (let i = 0; i < len; i++) {
                const p = slots[`${rowWord.id}-${i}`];
                if (!p) { isFull = false; break; }
                rowPieces.push(p);
            }

            if (isFull) {
                const formedWord = rowPieces.map(p => p.text).join('').toLowerCase();

                // Get currently solved entries to check for collisions
                const solvedEntries = Object.entries(completedRows);

                // Find matching target
                const matchedWord = currentStageWords.find(w => {
                    if (w.syllables.join('').toLowerCase() !== formedWord) return false;
                    // Check if used by any OTHER row (ignoring self)
                    const usedByOther = solvedEntries.find(([rId, sId]) => sId === w.id && rId !== rowWord.id);
                    return !usedByOther;
                });

                if (matchedWord) {
                    // Only update if not already set to this ID
                    if (completedRows[rowWord.id] !== matchedWord.id) {
                        // if (audioEnabled) speak(matchedWord.word); // Removed per user request
                        setCompletedRows(prev => ({
                            ...prev,
                            [rowWord.id]: matchedWord.id
                        }));
                    }
                } else {
                    // Invalid or duplicate
                    if (completedRows[rowWord.id]) {
                        setCompletedRows(prev => {
                            const next = { ...prev };
                            delete next[rowWord.id];
                            return next;
                        });
                    }
                }
            } else {
                // Not full - unmark
                if (completedRows[rowWord.id]) {
                    setCompletedRows(prev => {
                        const next = { ...prev };
                        delete next[rowWord.id];
                        return next;
                    });
                }
            }
        });
    }, [slots, completedRows, gameState.stages, gameState.currentStageIndex]);

    const handleManualAdvance = useCallback(() => {
        setGameState(prev => {
            const isLastStage = prev.currentStageIndex >= prev.stages.length - 1;
            if (isLastStage) {
                return { ...prev, gameStatus: 'finished' };
            } else {
                return {
                    ...prev,
                    currentStageIndex: prev.currentStageIndex + 1,
                    gameStatus: 'playing'
                };
            }
        });
    }, []);

    // Check Stage Completion
    useEffect(() => {
        // No Auto Advance
    }, [completedRows, gameState.stages, gameState.currentStageIndex]);


    // --------------------------------------------------------------------------------
    // 5. RENDER HELPERS (Hooks must be before any early returns)
    // --------------------------------------------------------------------------------

    const totalWords = useMemo(() => gameState.stages.reduce((acc, stage) => acc + stage.items.length, 0), [gameState.stages]);
    const progress = useMemo(() => {
        if (totalWords === 0) return 0;
        const previousStagesWords = gameState.stages.slice(0, gameState.currentStageIndex).reduce((acc, stage) => acc + stage.items.length, 0);
        const currentStageCompletedCount = Object.keys(completedRows).length;
        return Math.min(100, ((previousStagesWords + currentStageCompletedCount + 1) / totalWords) * 100);
    }, [gameState.stages, gameState.currentStageIndex, completedRows, totalWords]);

    const handleWordsCountChange = (delta) => {
        const next = Math.max(2, Math.min(6, pendingWordsCount + delta));
        if (next === pendingWordsCount) return;

        setPendingWordsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            startNewGame(next);
            debounceTimerRef.current = null;
        }, 1200);
    };

    const getPieceColor = (pieceColor) => {
        if (activeColor === 'neutral') return 'bg-blue-500'; // Default to blue
        if (activeColor && activeColor !== 'neutral') return activeColor;
        return pieceColor || 'bg-blue-500';
    };

    const getVisiblePieces = (zone) => {
        const inSlots = Object.values(slots).map(p => p.id);
        return pieces[zone].filter(p => !inSlots.includes(p.id));
    };

    const getSlotStyles = (piece, index, length) => {
        const base = 200;
        const pieceWidth = piece ? piece.width : base;
        const stretchX = pieceWidth / base;
        const overlap = 25 * stretchX * gameState.pieceScale;

        return {
            width: `${pieceWidth * gameState.pieceScale}px`,
            height: `${110 * gameState.pieceScale}px`,
            marginLeft: index === 0 ? 0 : `-${overlap}px`,
            zIndex: 10 + index
        };
    };

    // --------------------------------------------------------------------------------
    // 6. RENDER
    // --------------------------------------------------------------------------------

    if ((gameState.gameStatus === 'playing' && (!gameState.stages[gameState.currentStageIndex] || gameState.stages.length === 0)) || gameState.gameStatus === 'no_words') {
        return (
            <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col items-center justify-center p-6">
                <EmptyStateMessage
                    onClose={onClose}
                    secondStepText="Wörter mit mindestens 2 Silben markieren."
                />
            </div>
        );
    }

    if (gameState.gameStatus === 'finished') {
        return (
            <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">Super!</h2>
                <p className="text-slate-600 mb-8 text-xl">Alle Wörter gepuzzelt.</p>
                <div className="flex gap-4 relative z-10">
                    <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all flex items-center gap-2">
                        <RotateCcw /> Noch einmal
                    </button>
                    <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-2xl font-bold shadow-sm text-lg hover:bg-slate-50 transition-all">Beenden</button>
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
        );
    }

    if (gameState.gameStatus === 'loading') return <div className="fixed inset-0 bg-white z-[100]" />;

    const currentStageItems = gameState.stages[gameState.currentStageIndex]?.items || [];

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.Silbenpuzzle2 size={32} className="text-blue-600" />
                    <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenpuzzle 2"}</span>

                    {/* Numeric Progress Indicator (Standardized) */}
                    <div className="flex items-center gap-1 ml-4 overflow-x-auto max-w-[400px] no-scrollbar py-2 px-1">
                        {gameState.stages.map((_, i) => (
                            <div
                                key={i}
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0
                                    ${i === gameState.currentStageIndex
                                        ? 'bg-blue-600 text-white scale-110 shadow-md'
                                        : i < gameState.currentStageIndex
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

                <div className="flex items-center gap-4">
                    {/* Audio Toggle */}
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                        title={audioEnabled ? 'Audio an' : 'Audio aus'}
                    >
                        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>

                    {/* Words Count Control */}
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                        <HorizontalLines count={2} />
                        <button onClick={() => handleWordsCountChange(-1)} disabled={gameState.wordsPerStage <= 2} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                {pendingWordsCount}
                            </span>
                        </div>
                        <button onClick={() => handleWordsCountChange(1)} disabled={gameState.wordsPerStage >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg hidden md:flex">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="0.6"
                            max="1.3"
                            step="0.1"
                            value={gameState.pieceScale}
                            onChange={(e) => setGameState(prev => ({ ...prev, pieceScale: parseFloat(e.target.value) }))}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 text-white rounded-lg w-10 h-10 flex items-center justify-center border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>
            <ProgressBar progress={progress} />


            {/* Main Content */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* LEFT ZONE - Anfangsstücke */}
                <div className="w-[230px] bg-slate-100/50 border-r border-slate-200 flex flex-col shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const pid = e.dataTransfer.getData("application/puzzle-piece-id");
                        if (pid) handleReturnToPool(pid);
                    }}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anfang</div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-4 flex flex-col items-center gap-4">
                        {getVisiblePieces('left').map(p => {
                            const isHighlighted = highlightedWordId === p.wordId;
                            const isSelected = selectedPiece?.id === p.id;
                            return (
                                <div key={p.id}
                                    className={`transition-all duration-200 cursor-pointer
                                        ${isHighlighted ? 'scale-110 drop-shadow-xl' : ''}
                                        ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'}
                                    `}
                                    style={{ filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none' }}
                                    onClick={() => handlePieceSelect(p)}
                                    draggable onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                    onDragEnd={() => setIsDragging(null)}>
                                    <PuzzleTestPiece
                                        label={p.text}
                                        type="left"
                                        colorClass={getPieceColor(p.color)}
                                        dynamicWidth={p.width}
                                        scale={gameState.pieceScale * 0.8}
                                        fontFamily={settings.fontFamily}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MIDDLE ZONE + CENTER */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Top strip for Middle Pieces */}
                    <div className="h-[28%] bg-blue-50/30 border-b border-blue-100 relative w-full overflow-hidden shrink-0"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const pid = e.dataTransfer.getData("application/puzzle-piece-id");
                            if (pid) handleReturnToPool(pid);
                        }}
                    >
                        <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mitte</div>
                        <div className="w-full h-full relative pt-6 px-4 pb-4 flex flex-wrap items-center justify-center gap-4 content-center overflow-y-auto custom-scroll">
                            {getVisiblePieces('middle').map(p => {
                                const isHighlighted = highlightedWordId === p.wordId;
                                const isSelected = selectedPiece?.id === p.id;
                                return (
                                    <div key={p.id}
                                        className={`transition-all duration-200 cursor-pointer
                                            ${isHighlighted ? 'scale-110 z-[100] drop-shadow-xl' : ''}
                                            ${isSelected ? 'scale-110 z-50' : 'hover:z-50 hover:scale-105 active:scale-95'}
                                        `}
                                        style={{
                                            transform: `rotate(${p.rotation}deg)`,
                                            filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none'
                                        }}
                                        onClick={() => handlePieceSelect(p)}
                                        draggable onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                        onDragEnd={() => setIsDragging(null)}>
                                        <PuzzleTestPiece
                                            label={p.text}
                                            type="middle"
                                            colorClass={getPieceColor(p.color)}
                                            dynamicWidth={p.width}
                                            scale={gameState.pieceScale * 0.8}
                                            fontFamily={settings.fontFamily}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Word Rows Area */}
                    <div className="flex-1 overflow-y-auto custom-scroll p-6 pt-12 flex flex-col items-center gap-8 bg-slate-50/30">
                        {currentStageItems.map((word, idx) => {
                            const solvedId = completedRows[word.id];
                            const isComplete = !!solvedId;
                            const isLastItem = idx === currentStageItems.length - 1;
                            const allSolved = currentStageItems.every(w => completedRows[w.id]);

                            // Audio Text: Solved word or target word
                            const audioText = isComplete && solvedId
                                ? (currentStageItems.find(w => w.id === solvedId)?.word || word.word)
                                : word.word;

                            return (
                                <div key={word.id} className={`flex items-center gap-20 transition-all duration-500 ${isComplete ? 'opacity-80 scale-95' : ''}`}>
                                    <div className="relative flex items-center pr-12" style={{ height: 110 * gameState.pieceScale }}>
                                        <div className="flex items-center gap-0" style={{ transform: `scale(${gameState.pieceScale})`, transformOrigin: 'left center', height: 110 }}>
                                            {word.syllables.map((syl, idx) => {
                                                const slotKey = `${word.id}-${idx}`;
                                                const piece = slots[slotKey];
                                                const len = word.syllables.length;
                                                const type = idx === 0 ? 'left' : (idx === len - 1 ? 'right' : 'middle');
                                                const slotStyles = getSlotStyles(piece, idx, len);

                                                const slotIsTarget = !piece && selectedPiece && selectedPiece.type === type;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`relative flex items-center justify-center transition-all duration-300 group ${slotIsTarget ? 'scale-105 cursor-pointer' : ''
                                                            }`}
                                                        style={{
                                                            ...slotStyles,
                                                            filter: slotIsTarget ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.7))' : 'none'
                                                        }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const id = e.dataTransfer.getData("application/puzzle-piece-id");
                                                            if (!isComplete) handleDrop(id, word.id, idx);
                                                        }}
                                                        onClick={() => {
                                                            if (!piece && !isComplete) handleSlotSelect(word.id, idx, word);
                                                        }}
                                                    >
                                                        {!piece && (
                                                            <div className="pointer-events-none opacity-40">
                                                                <PuzzleTestPiece
                                                                    label=""
                                                                    type={type}
                                                                    isGhost={true}
                                                                    scale={1}
                                                                    fontFamily={settings.fontFamily}
                                                                />
                                                            </div>
                                                        )}

                                                        {piece && (
                                                            <div
                                                                className="cursor-pointer hover:scale-105 transition-transform"
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData("application/puzzle-piece-id", piece.id);
                                                                    // Do not set isDragging(piece.id) to avoid hiding it in the slot immediately, or do?
                                                                    // Usually we want it visible while dragging until dropped.
                                                                }}
                                                                onClick={() => removePieceFromSlot(slotKey, word.id)}
                                                            >
                                                                <PuzzleTestPiece
                                                                    label={piece.text}
                                                                    type={type}
                                                                    colorClass={getPieceColor(piece.color)}
                                                                    scale={1}
                                                                    dynamicWidth={piece.width}
                                                                    showSeamLine={true}
                                                                    fontFamily={settings.fontFamily}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Audio, Checkmark & Manual Advance Group */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-4 min-h-[56px]">
                                            {/* Speaker */}
                                            {audioEnabled && (
                                                <button
                                                    onClick={() => speak(audioText)}
                                                    className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ring-4 ring-white/50 hover:scale-105 active:scale-95 z-10"
                                                    title="Anhören"
                                                >
                                                    <Icons.Volume2 size={24} />
                                                </button>
                                            )}

                                            {/* Checkmark - Flex for reliable alignment */}
                                            <div className={`transition-all duration-500 ease-out flex items-center
                                                ${isComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                            `}>
                                                <CheckCircle2 className="text-green-500 drop-shadow-2xl" style={{ width: '56px', height: '56px' }} />
                                            </div>
                                        </div>

                                        {/* Manual Advance Button - Below Speaker Layout */}
                                        {(isLastItem && allSolved) && (
                                            <div className="animate-in slide-in-from-top-4 duration-300 mt-6">
                                                <button
                                                    onClick={handleManualAdvance}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white pl-6 pr-4 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-white/50 whitespace-nowrap"
                                                >
                                                    Weiter <CheckCircle2 size={24} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Spacer for scrolling */}
                        <div className="h-20 w-full" />
                    </div>
                </div>

                {/* RIGHT ZONE - Endstücke */}
                <div className="w-[230px] bg-slate-100/50 border-l border-slate-200 flex flex-col shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const pid = e.dataTransfer.getData("application/puzzle-piece-id");
                        if (pid) handleReturnToPool(pid);
                    }}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ende</div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-4 flex flex-col items-center gap-4">
                        {getVisiblePieces('right').map(p => {
                            const isHighlighted = highlightedWordId === p.wordId;
                            const isSelected = selectedPiece?.id === p.id;
                            return (
                                <div key={p.id}
                                    className={`transition-all duration-200 cursor-pointer
                                        ${isHighlighted ? 'scale-110 drop-shadow-xl' : ''}
                                        ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 active:scale-95'}
                                    `}
                                    style={{ filter: isSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none' }}
                                    onClick={() => handlePieceSelect(p)}
                                    draggable onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                    onDragEnd={() => setIsDragging(null)}>
                                    <PuzzleTestPiece
                                        label={p.text}
                                        type="right"
                                        colorClass={getPieceColor(p.color)}
                                        dynamicWidth={p.width}
                                        scale={gameState.pieceScale * 0.8}
                                        fontFamily={settings.fontFamily}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            {/* Manual Advance Button */}
            {/* Manual Advance Button Removed (Moved to inside list) */}
        </div >
    );
};
