import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Minus,
    Plus
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';

// Helper component for horizontal lines in the stepper control
const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-4 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

export const PuzzleTestMultiSyllableView = ({ words, settings, onClose, title }) => {
    // Game State
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 1.0,
        wordsPerStage: 3
    });

    const [isDragging, setIsDragging] = useState(null);

    // Pieces & Slots State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [slots, setSlots] = useState({}); // Key: "wordId-slotIdx" -> piece
    const [completedWords, setCompletedWords] = useState(new Set());
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

        if (!words || words.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'loading' }));
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

        // Shuffle words and create stages
        const shuffled = [...validWords].sort(() => Math.random() - 0.5);
        const newStages = [];

        for (let i = 0; i < shuffled.length; i += wps) {
            const chunk = shuffled.slice(i, i + wps);
            if (chunk.length > 0) {
                newStages.push({ items: chunk });
            }
        }

        setGameState(prev => ({
            ...prev,
            stages: newStages,
            currentStageIndex: 0,
            gameStatus: 'playing',
            wordsPerStage: wps
        }));

        setCompletedWords(new Set());
        setSlots({});
        setHighlightedWordId(null);
        setLastSpokenWord(null);

    }, [words, gameState.wordsPerStage]);

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
        setCompletedWords(new Set()); // Clear completed for this stage context

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

        const targetLength = parseInt(wordId); // wordId here is actually length passed from render
        // We need to verify piece fits slot type.
        const requiredType = slotIndex === 0 ? 'left' : (slotIndex === targetLength - 1 ? 'right' : 'middle');
        if (foundPiece.type !== requiredType) return;

        // Place piece
        const slotKey = `${targetLength}-${slotIndex}`;

        setSlots(prev => {
            const next = { ...prev };
            // Remove piece if already elsewhere (unlikely with unique IDs)
            Object.keys(next).forEach(k => {
                if (next[k] && next[k].id === pieceId) delete next[k];
            });
            next[slotKey] = foundPiece;
            return next;
        });
    };

    const removePieceFromSlot = (slotKey) => {
        if (highlightedWordId) return; // Block interaction during success animation if needed
        setSlots(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    // Audio Aid
    const handleSpeakHelp = () => {
        // 1. If pieces are in slots, speak the word of the FIRST piece
        const slotKeys = Object.keys(slots);
        if (slotKeys.length > 0) {
            // Find first slot
            const sortedKeys = slotKeys.sort();
            const firstPiece = slots[sortedKeys[0]];
            if (firstPiece && firstPiece.wordId) {
                const w = words.find(x => x.id === firstPiece.wordId);
                if (w) speak(w.word);
            }
            return;
        }

        // 2. No pieces in slots? Recommend a word.
        // Find a word from the CURRENT STAGE that is not yet completed.
        const stageWords = gameState.stages[gameState.currentStageIndex].items;
        const pendingWord = stageWords.find(w => !completedWords.has(w.id));

        if (pendingWord) {
            speak(pendingWord.word);

            // VISUAL HIGHLIGHT
            setHighlightedWordId(pendingWord.id);
            if (audioHighlightTimerRef.current) clearTimeout(audioHighlightTimerRef.current);
            audioHighlightTimerRef.current = setTimeout(() => {
                setHighlightedWordId(null);
            }, 1000);
        }
    };


    // --------------------------------------------------------------------------------
    // 4. VALIDATION LOOP
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStageWords = gameState.stages[gameState.currentStageIndex].items;

        // Group words by length
        const stageLengths = [...new Set(currentStageWords.map(w => w.syllables.length))];

        stageLengths.forEach(len => {
            // Check the row for this length
            let isFull = true;
            const rowPieces = [];
            for (let i = 0; i < len; i++) {
                const p = slots[`${len}-${i}`];
                if (!p) { isFull = false; break; }
                rowPieces.push(p);
            }

            if (isFull) {
                const formedWord = rowPieces.map(p => p.text).join('');
                // Check against valid words in THIS stage
                const match = currentStageWords.find(w => w.syllables.join('') === formedWord);

                if (match) {
                    // Success!
                    // Mark word complete
                    setCompletedWords(prev => new Set(prev).add(match.id));
                    setSlots(prev => {
                        const next = { ...prev };
                        for (let i = 0; i < len; i++) delete next[`${len}-${i}`];
                        return next;
                    });

                    // Remove pieces from pool permanently for this stage
                    setPieces(prev => {
                        const next = { ...prev };
                        ['left', 'middle', 'right'].forEach(zone => {
                            next[zone] = next[zone].filter(p => !rowPieces.some(used => used.id === p.id));
                        });
                        return next;
                    });
                }
            }
        });

    }, [slots, gameState.stages, gameState.currentStageIndex]);

    // Check Stage Completion
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStageWords = gameState.stages[gameState.currentStageIndex].items;

        const allComplete = currentStageWords.every(w => completedWords.has(w.id));

        if (allComplete && currentStageWords.length > 0) {
            // Delay move to next stage
            const timer = setTimeout(() => {
                if (gameState.currentStageIndex < gameState.stages.length - 1) {
                    setGameState(prev => ({
                        ...prev,
                        currentStageIndex: prev.currentStageIndex + 1
                    }));
                } else {
                    setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [completedWords, gameState.stages, gameState.currentStageIndex]);


    // --------------------------------------------------------------------------------
    // 5. RENDER HELPERS
    // --------------------------------------------------------------------------------

    const handleWordsCountChange = (delta) => {
        const next = Math.max(1, Math.min(6, gameState.wordsPerStage + delta));
        setGameState(prev => ({ ...prev, wordsPerStage: next }));

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            startNewGame(next);
        }, 800);
    };

    const getVisibleLengths = () => {
        if (!gameState.stages[gameState.currentStageIndex]) return [];
        // Only show lengths that have pending words in THIS stage
        const stageWords = gameState.stages[gameState.currentStageIndex].items;
        const pending = stageWords.filter(w => !completedWords.has(w.id));
        const lengths = [...new Set(pending.map(w => w.syllables.length))].sort((a, b) => a - b);
        return lengths;
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
            zIndex: 10 + (20 - index)
        };
    };

    // --------------------------------------------------------------------------------
    // 6. RENDER
    // --------------------------------------------------------------------------------

    if (gameState.gameStatus === 'no_words') {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine geeigneten Wörter gefunden.</h2>
                <p className="text-slate-600 mb-6">Bitte markiere Wörter mit mindestens 2 Silben.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Zurück</button>
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

    const visibleLengths = getVisibleLengths();

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.SyllableTestMulti className="text-blue-600 w-8 h-8" />
                    <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenpuzzle 2"}</span>

                    {/* Stage Indicator */}
                    <div className="flex items-center gap-1 ml-4 overflow-x-auto max-w-[200px] no-scrollbar">
                        {gameState.stages.map((_, i) => (
                            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i === gameState.currentStageIndex ? 'bg-blue-600 scale-125' : i < gameState.currentStageIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Words Count Control */}
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200 hidden lg:flex">
                        <HorizontalLines count={2} />
                        <button onClick={() => handleWordsCountChange(-1)} disabled={gameState.wordsPerStage <= 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className="text-xl font-black text-slate-800 leading-none">
                                {gameState.wordsPerStage}
                            </span>
                        </div>
                        <button onClick={() => handleWordsCountChange(1)} disabled={gameState.wordsPerStage >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg hidden md:flex">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="0.6"
                            max="1.2"
                            step="0.1"
                            value={gameState.pieceScale}
                            onChange={(e) => setGameState(prev => ({ ...prev, pieceScale: parseFloat(e.target.value) }))}
                            className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            <div className="flex flex-col items-center pt-8 bg-blue-50/30">
                <button
                    onClick={handleSpeakHelp}
                    className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 shrink-0"
                    title="Wort anhören"
                >
                    <Icons.Volume2 size={24} />
                </button>
            </div>


            {/* Main Content */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* LEFT ZONE - Vertical Scroll Stacking */}
                <div className="w-1/5 bg-slate-100/50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100/90 py-2 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 border-b border-slate-200 shrink-0">Anfang</div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 no-scrollbar">
                        {getVisiblePieces('left').map(p => {
                            const isHighlighted = highlightedWordId === p.wordId;
                            return (
                                <div key={p.id}
                                    className={`flex justify-center transition-transform cursor-grab active:cursor-grabbing transform-gpu
                                        ${isHighlighted ? 'scale-125 z-50 drop-shadow-xl' : 'hover:scale-105 active:scale-95'}
                                    `}
                                    style={{ transform: `rotate(${p.rotation}deg) scale(${gameState.pieceScale})` }}>
                                    <PuzzleTestPiece
                                        id={p.id}
                                        label={p.text}
                                        type="left"
                                        colorClass={p.color}
                                        dynamicWidth={p.width}
                                        onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                        onDragEnd={() => setIsDragging(null)}
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
                    <div className="h-[40%] bg-slate-50 border-b-2 border-slate-100 relative overflow-hidden w-full flex-shrink-0 z-10 transition-all duration-300">
                        <div className="absolute top-2 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10">Mitte</div>
                        <div className="w-full h-full relative">
                            {getVisiblePieces('middle').map(p => {
                                const isHighlighted = highlightedWordId === p.wordId;
                                return (
                                    <div key={p.id}
                                        className={`absolute transition-transform cursor-grab active:cursor-grabbing
                                            ${isHighlighted ? 'z-[100] scale-125 drop-shadow-xl' : 'hover:z-50'}
                                        `}
                                        style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg) scale(${gameState.pieceScale})` }}>
                                        <PuzzleTestPiece
                                            id={p.id}
                                            label={p.text}
                                            type="middle"
                                            colorClass={p.color}
                                            dynamicWidth={p.width}
                                            onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                            onDragEnd={() => setIsDragging(null)}
                                            fontFamily={settings.fontFamily}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Templates Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4 w-full mt-6 no-scrollbar pb-32">
                        {visibleLengths.map(len => (
                            <div key={len} className="flex flex-col items-center gap-3 w-full animate-fadeIn shrink-0">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{len} Silben</span>

                                <div className={`
                                    relative flex items-center justify-center transition-all duration-500 py-4
                                `}>
                                    <div className="flex items-center">
                                        {Array.from({ length: len }).map((_, idx) => {
                                            const slotKey = `${len}-${idx}`;
                                            const piece = slots[slotKey];
                                            const type = idx === 0 ? 'left' : (idx === len - 1 ? 'right' : 'middle');
                                            const slotStyles = getSlotStyles(piece, idx, len);

                                            return (
                                                <div
                                                    key={idx}
                                                    className="relative flex items-center justify-center transition-all duration-300 group"
                                                    style={slotStyles}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const id = e.dataTransfer.getData("application/puzzle-piece-id");
                                                        handleDrop(id, len, idx); // Pass LENGTH as 2nd arg
                                                    }}
                                                >
                                                    {/* TRANSPARENT HIT AREA */}
                                                    <div className="absolute inset-[-20px] z-0" />

                                                    {/* Empty Slot Ghost */}
                                                    {!piece && (
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                            <PuzzleTestPiece
                                                                label=""
                                                                type={type}
                                                                isGhost={true}
                                                                scale={gameState.pieceScale}
                                                                fontFamily={settings.fontFamily}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Filled Slot */}
                                                    {piece && (
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => removePieceFromSlot(slotKey)}
                                                        >
                                                            <PuzzleTestPiece
                                                                id={piece.id}
                                                                label={piece.text}
                                                                type={type}
                                                                colorClass={piece.color}
                                                                scale={gameState.pieceScale}
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
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT ZONE - Vertical Scroll Stacking */}
                <div className="w-1/5 bg-slate-100/50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100/90 py-2 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 border-b border-slate-200 shrink-0">Ende</div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 no-scrollbar">
                        {getVisiblePieces('right').map(p => {
                            const isHighlighted = highlightedWordId === p.wordId;
                            return (
                                <div key={p.id}
                                    className={`flex justify-center transition-transform cursor-grab active:cursor-grabbing transform-gpu
                                        ${isHighlighted ? 'scale-125 z-50 drop-shadow-xl' : 'hover:scale-105 active:scale-95'}
                                    `}
                                    style={{ transform: `rotate(${p.rotation}deg) scale(${gameState.pieceScale})` }}>
                                    <PuzzleTestPiece
                                        id={p.id}
                                        label={p.text}
                                        type="right"
                                        colorClass={p.color}
                                        dynamicWidth={p.width}
                                        onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); setIsDragging(p.id); }}
                                        onDragEnd={() => setIsDragging(null)}
                                        fontFamily={settings.fontFamily}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
