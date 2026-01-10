
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Maximize2,
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

const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-4 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

export const SyllableCompositionExtensionView = ({ words, settings, onClose, title, activeColor }) => {
    // Game Configuration
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 1.0,
        wordsPerStage: 3
    });

    const [isDragging, setIsDragging] = useState(null);

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

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);
    const [activeLengths, setActiveLengths] = useState([]); // Needed for drop logic compatibility? No, we use stage items.

    // State for Pieces & Slots
    // scrambledPieces: Array of { id, text, type, color, ... }
    // placedPieces: Object { "targetId-slotIdx": pieceId }
    const [scrambledPieces, setScrambledPieces] = useState({ left: [], middle: [], right: [] });
    const [placedPieces, setPlacedPieces] = useState({});
    const [completedRows, setCompletedRows] = useState({}); // Map<RowTargetID, SolvedTargetID>
    const [audioEnabled, setAudioEnabled] = useState(true);

    const moveTimerRef = useRef(null);

    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);

    const totalWords = useMemo(() => gameState.stages.reduce((acc, stage) => acc + stage.items.length, 0), [gameState.stages]);
    const progress = useMemo(() => {
        if (totalWords === 0) return 0;
        const previousStagesWords = gameState.stages.slice(0, gameState.currentStageIndex).reduce((acc, stage) => acc + stage.items.length, 0);
        const currentStageCompletedCount = Object.keys(completedRows).length;
        return Math.min(100, ((previousStagesWords + currentStageCompletedCount + 1) / totalWords) * 100);
    }, [gameState.stages, gameState.currentStageIndex, completedRows, totalWords]);

    // --------------------------------------------------------------------------------
    // 1. GENERATE PUZZLE DATA
    // --------------------------------------------------------------------------------
    const validTargets = useMemo(() => {
        const potentialTargets = [];
        const seen = new Set();

        let candidateSyllables = [];
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w && Array.isArray(w.syllables)) {
                    w.syllables.forEach(s => { if (typeof s === 'string') candidateSyllables.push(s); });
                } else if (w && w.word) {
                    candidateSyllables.push(w.word);
                }
            });
        }

        // Filter & Split
        candidateSyllables.forEach(syl => {
            if (!syl || typeof syl !== 'string') return;
            const cleanSyl = syl.toLowerCase().trim();
            if (cleanSyl.length < 2) return;
            if (seen.has(cleanSyl)) return;

            // Greedy Split Logic (Matches original Extension logic)
            // No Audio filter required per user spec
            let parts = [];
            let remaining = cleanSyl;
            const clusterList = Array.from(allowedClusters).sort((a, b) => b.length - a.length);

            while (remaining.length > 0) {
                let foundCluster = false;
                for (let cluster of clusterList) {
                    if (remaining.startsWith(cluster)) {
                        parts.push(cluster);
                        remaining = remaining.substring(cluster.length);
                        foundCluster = true;
                        break;
                    }
                }
                if (!foundCluster) {
                    parts.push(remaining[0]);
                    remaining = remaining.substring(1);
                }
            }

            if (parts.length >= 2) {
                potentialTargets.push({
                    id: cleanSyl + '-' + Math.random().toString(36).substr(2, 5),
                    full: cleanSyl,
                    parts: parts
                });
                seen.add(cleanSyl);
            }
        });

        return potentialTargets.sort(() => Math.random() - 0.5);
    }, [words, allowedClusters]);


    // --------------------------------------------------------------------------------
    // 2. GAME LOOP CONTROLLER
    // --------------------------------------------------------------------------------
    const startNewGame = useCallback((currWps) => {
        const wps = currWps !== undefined ? currWps : pendingWordsCount;

        if (validTargets.length === 0) {
            setGameState(prev => ({ ...prev, gameStatus: 'playing', stages: [], wordsPerStage: wps }));
            return;
        }

        // Shuffle targets
        const shuffled = [...validTargets].sort(() => Math.random() - 0.5);
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

        setCompletedRows({});
        setPlacedPieces({});

    }, [validTargets, pendingWordsCount]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);


    // --------------------------------------------------------------------------------
    // 3. SETUP STAGE PIECES
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (gameState.gameStatus !== 'playing' || !gameState.stages[gameState.currentStageIndex]) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const newPools = { left: [], middle: [], right: [] };
        const usedIds = new Set();

        // Generate Pieces for all targets in this stage
        currentStage.items.forEach((target, tIdx) => {
            target.parts.forEach((partText, pIdx) => {
                const isFirst = pIdx === 0;
                const isLast = pIdx === target.parts.length - 1;

                // Deterministic Type
                let type = 'zigzag-middle';
                if (isFirst) type = 'zigzag-left';
                else if (isLast) type = 'zigzag-right';

                const pieceId = `${target.id}-${pIdx}`;

                const piece = {
                    id: pieceId,
                    text: partText,
                    type: type,
                    color: 'bg-blue-500',
                    targetId: target.id, // For verification only? Or allowing mix?
                    // "Silbenbau" typically lets you mix parts as long as text matches?
                    // User said: "Es gibt die Einstellung... wie viele Wörter gleichzeitig ... dargeboten werden."
                    // Implication: You solve multiple words from a mixed pool.
                    // So we shouldn't strictly bind a piece ID to a slot ID if texts are identical.
                    // But for simplicity, let's keep identity for now, or use text matching.
                    // Let's rely on ID for Dragging, but check logic might use ID.

                    rotation: (Math.random() - 0.5) * 8, // slight jitter for middle
                    // Middle pieces need grid positions
                    x: 10 + Math.random() * 80,
                    y: 10 + Math.random() * 80
                };

                // Add to appropriate pool
                if (isFirst) newPools.left.push(piece);
                else if (isLast) newPools.right.push(piece);
                else newPools.middle.push(piece);
            });
        });

        // Shuffle within pools
        ['left', 'middle', 'right'].forEach(k => {
            newPools[k].sort(() => Math.random() - 0.5);
            // Arrange Middle pieces in a grid/random spread?
            // Re-calc positions for middle to avoid overlap?
            if (k === 'middle') {
                newPools[k] = newPools[k].map((p, i) => ({
                    ...p,
                    x: (i % 3) * 30 + 10 + (Math.random() * 10),
                    y: Math.floor(i / 3) * 30 + 10 + (Math.random() * 10)
                }));
            }
        });

        setScrambledPieces(newPools);
        setPlacedPieces({});
        setCompletedRows({});

    }, [gameState.currentStageIndex, gameState.stages, gameState.gameStatus]);



    // --------------------------------------------------------------------------------
    // 4. INTERACTION HANDLERS
    // --------------------------------------------------------------------------------
    const handleDrop = (pieceId, targetId, slotIndex) => {
        // Find piece in pools
        let foundPiece = null;
        let sourcePool = null;

        ['left', 'middle', 'right'].forEach(pool => {
            const p = scrambledPieces[pool].find(x => x.id === pieceId);
            if (p) {
                foundPiece = p;
                sourcePool = pool;
            }
        });

        if (!foundPiece) return;

        const currentStage = gameState.stages[gameState.currentStageIndex];
        const target = currentStage.items.find(t => t.id === targetId);
        if (!target) return;

        const isStart = slotIndex === 0;
        const isEnd = slotIndex === target.parts.length - 1;
        let requiredType = 'zigzag-middle';
        if (isStart) requiredType = 'zigzag-left';
        if (isEnd) requiredType = 'zigzag-right';

        if (foundPiece.type !== requiredType) return; // Wrong type for slot

        // Place it
        const slotKey = `${targetId}-${slotIndex}`;

        setPlacedPieces(prev => {
            const next = { ...prev };

            // Check if this piece is already in another slot and remove it
            const existingKey = Object.keys(next).find(k => next[k].id === foundPiece.id);
            if (existingKey) {
                delete next[existingKey];
            }

            // Assign to new slot
            next[slotKey] = foundPiece;
            return next;
        });

    };

    const handleRemove = (targetId, slotIndex) => {
        const slotKey = `${targetId}-${slotIndex}`;
        // if (completedRows[targetId]) return; // Locked
        setPlacedPieces(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    const handleReturnToPool = (pieceId) => {
        // Find if this piece is in placedPieces and remove it
        setPlacedPieces(prev => {
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

    // --------------------------------------------------------------------------------
    // 5. VALIDATION
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];

        // check each row (defined by a target item)
        currentStage.items.forEach(rowTarget => {
            // Lock removed for flexible validation

            // Check if all slots in this row are filled
            let isFull = true;
            let currentParts = [];
            for (let i = 0; i < rowTarget.parts.length; i++) {
                const p = placedPieces[`${rowTarget.id}-${i}`];
                if (!p) { isFull = false; break; }
                currentParts.push(p.text);
            }

            if (isFull) {
                // Determine what word was formed
                const formed = currentParts.join('');

                // Get currently solved entries to check for collisions
                const solvedEntries = Object.entries(completedRows);

                // Check if this formed word matches ANY valid target in the stage
                // that is NOT already used by ANOTHER row.
                const matchedTarget = currentStage.items.find(t => {
                    if (t.full !== formed) return false;
                    // Check if used by any OTHER row (ignoring self)
                    const usedByOther = solvedEntries.find(([rId, sId]) => sId === t.id && rId !== rowTarget.id);
                    return !usedByOther;
                });

                if (matchedTarget) {
                    // Success! 
                    if (completedRows[rowTarget.id] !== matchedTarget.id) {
                        // if (audioEnabled) speak(matchedTarget.full); // Removed per user request
                        setCompletedRows(prev => ({
                            ...prev,
                            [rowTarget.id]: matchedTarget.id
                        }));
                    }
                } else {
                    // Full but invalid or duplicate used by other
                    if (completedRows[rowTarget.id]) {
                        setCompletedRows(prev => {
                            const next = { ...prev };
                            delete next[rowTarget.id];
                            return next;
                        });
                    }
                }
            } else {
                // Not full - if it was marked as complete, unmark it
                if (completedRows[rowTarget.id]) {
                    setCompletedRows(prev => {
                        const next = { ...prev };
                        delete next[rowTarget.id];
                        return next;
                    });
                }
            }
        });
    }, [placedPieces, completedRows, gameState.stages, gameState.currentStageIndex]);

    // Check Stage Complete
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];

        // All rows must have a solution
        // Or all targets must be found?
        // Since number of rows == number of targets, checking if all rows have an entry in completedRows acts as "All done".
        const allDone = currentStage.items.every(t => completedRows[t.id]);

        if (currentStage.items.length > 0 && allDone) {
            // Stage Complete
            const timer = setTimeout(() => {
                setGameState(prev => {
                    const isLastStage = prev.currentStageIndex >= prev.stages.length - 1;
                    if (isLastStage) {
                        return { ...prev, gameStatus: 'finished' };
                    } else {
                        return {
                            ...prev,
                            ...prev,
                            currentStageIndex: prev.currentStageIndex + 1,
                            gameStatus: 'playing' // Ensure it's playing
                        };
                    }
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [completedRows, gameState.stages, gameState.currentStageIndex]);


    // --------------------------------------------------------------------------------
    // 6. RENDER HELPERS
    // --------------------------------------------------------------------------------
    const handleWordsCountChange = (delta) => {
        const next = Math.max(1, Math.min(6, pendingWordsCount + delta));
        setPendingWordsCount(next);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            startNewGame(next);
        }, 800);
    };

    if (gameState.gameStatus === 'finished') {
        return (
            <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">Super!</h2>

                <p className="text-slate-600 mb-8 text-xl">Alle Silben gebaut.</p>
                <div className="flex gap-4">
                    <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all flex items-center gap-2">
                        <RotateCcw /> Noch einmal
                    </button>
                    <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-2xl font-bold shadow-sm text-lg hover:bg-slate-50 transition-all">Beenden</button>
                </div>
            </div>
        );
    }

    if (gameState.gameStatus === 'loading') {
        return <div className="fixed inset-0 bg-white z-[100]" />;
    }

    // Safe guard: If playing but no stages or invalid index
    if (gameState.gameStatus === 'playing' && (!gameState.stages[gameState.currentStageIndex] || gameState.stages.length === 0)) {
        return (
            <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col items-center justify-center p-6">
                <EmptyStateMessage
                    onClose={onClose}
                    secondStepText="Wörter markieren, deren Silben sich für den Silbenbau eignen."
                />
            </div>
        );
    }



    const getPieceColor = (pieceColor) => {
        if (activeColor === 'neutral') return 'bg-blue-500'; // Default to blue
        if (activeColor && activeColor !== 'neutral') return activeColor;
        return pieceColor || 'bg-blue-500';
    };

    const currentStage = gameState.stages[gameState.currentStageIndex];

    // Filter out placed pieces from pools
    const allPlacedIds = new Set(Object.values(placedPieces).map(p => p.id));
    const leftVisible = scrambledPieces.left.filter(p => !allPlacedIds.has(p.id));
    const rightVisible = scrambledPieces.right.filter(p => !allPlacedIds.has(p.id));
    const middleVisible = scrambledPieces.middle.filter(p => !allPlacedIds.has(p.id));


    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}silbenbau2_logo.png`} className="w-auto h-10 object-contain" alt="Silbenbau 2" />
                    <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenbau 2"}</span>

                    {/* Numeric Progress Indicator (Standardized) */}
                    <div className="flex items-center gap-1 ml-4 overflow-x-auto max-w-[400px] no-scrollbar">
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
                        <button onClick={() => handleWordsCountChange(-1)} disabled={pendingWordsCount <= 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 ml-1">
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center min-w-[24px]">
                            <span className={`text-xl font-black transition-colors leading-none ${pendingWordsCount !== gameState.wordsPerStage ? 'text-orange-500' : 'text-slate-800'}`}>
                                {pendingWordsCount}
                            </span>
                        </div>
                        <button onClick={() => handleWordsCountChange(1)} disabled={pendingWordsCount >= 6} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all shadow-sm disabled:opacity-20 mr-1">
                            <Plus className="w-4 h-4" />
                        </button>
                        <HorizontalLines count={5} />
                    </div>

                    {/* Scale Control */}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg ml-2">
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

                    <button onClick={onClose} className="bg-red-500 text-white rounded-lg w-10 h-10 flex items-center justify-center ml-2 border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>
            <ProgressBar progress={progress} />

            <div className="flex-1 relative flex overflow-hidden">
                {/* LEFT SIDEBAR (Start Pieces) */}
                <div className="w-[180px] bg-slate-100/50 border-r border-slate-200 flex flex-col shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const pid = e.dataTransfer.getData("pieceId");
                        if (pid) handleReturnToPool(pid);
                    }}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase">Anfang</div>
                    <div className="flex-1 overflow-y-auto p-4 content-center gap-4 flex flex-col items-center">
                        {leftVisible.map(p => (
                            <div key={p.id} className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                draggable onDragStart={(e) => { e.dataTransfer.setData("pieceId", p.id); setIsDragging(p.id); }} onDragEnd={() => setIsDragging(null)}>
                                <PuzzleTestPiece label={p.text} type="zigzag-left" colorClass={getPieceColor(p.color)} scale={gameState.pieceScale * 0.8} fontFamily={settings.fontFamily} onDragStart={() => { }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Middle Pieces Pool (Top Strip) */}
                    <div className="h-[25%] bg-blue-50/30 border-b border-blue-100 relative w-full overflow-hidden shrink-0"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const pid = e.dataTransfer.getData("pieceId");
                            if (pid) handleReturnToPool(pid);
                        }}
                    >
                        <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 uppercase">Mitte</div>
                        <div className="w-full h-full relative p-4">
                            {middleVisible.map(p => (
                                <div key={p.id}
                                    className="absolute cursor-grab active:cursor-grabbing hover:z-50 transition-transform"
                                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)` }}
                                    draggable onDragStart={(e) => { e.dataTransfer.setData("pieceId", p.id); setIsDragging(p.id); }} onDragEnd={() => setIsDragging(null)}
                                >
                                    <PuzzleTestPiece label={p.text} type="zigzag-middle" colorClass={getPieceColor(p.color)} scale={gameState.pieceScale * 0.8} fontFamily={settings.fontFamily} onDragStart={() => { }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TARGETS LIST */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8 bg-slate-50/30">
                        {currentStage.items.map(target => {
                            const solvedId = completedRows[target.id];
                            const isComplete = !!solvedId;

                            // Audio should play the solved word if complete, otherwise the target hint
                            const audioText = isComplete
                                ? (currentStage.items.find(t => t.id === solvedId)?.full || target.full)
                                : target.full;

                            return (
                                <div key={target.id} className={`flex items-center gap-20 transition-all duration-500 ${isComplete ? 'opacity-80 scale-95' : ''}`}>
                                    {/* Slot Row */}
                                    <div className="relative flex items-center pr-12" style={{ height: 110 * gameState.pieceScale }}>
                                        <div className="flex items-center gap-0" style={{ transform: `scale(${gameState.pieceScale})`, transformOrigin: 'left center', height: 110 }}>
                                            {Array.from({ length: target.parts.length }).map((_, idx) => {
                                                const slotKey = `${target.id}-${idx}`;
                                                const piece = placedPieces[slotKey];
                                                const isStart = idx === 0;
                                                const isEnd = idx === target.parts.length - 1;

                                                const overlap = 30;
                                                const marginLeft = idx === 0 ? 0 : -overlap;
                                                const targetType = isStart ? 'zigzag-left' : (isEnd ? 'zigzag-right' : 'zigzag-middle');

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="relative flex items-center justify-center group"
                                                        style={{
                                                            width: 200, height: 110,
                                                            marginLeft: marginLeft,
                                                            zIndex: 10 + idx
                                                        }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const pid = e.dataTransfer.getData("pieceId");
                                                            if (pid && !isComplete) handleDrop(pid, target.id, idx);
                                                        }}
                                                    >
                                                        {!piece && (
                                                            <div className="pointer-events-none opacity-40">
                                                                <PuzzleTestPiece label="" type={targetType} isGhost scale={1} fontFamily={settings.fontFamily} />
                                                            </div>
                                                        )}
                                                        {piece && (
                                                            <div className="cursor-pointer hover:scale-105 transition-transform relative z-50"
                                                                onClick={(e) => { e.stopPropagation(); handleRemove(target.id, idx); }}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    // Allow "pulling out" via drag
                                                                    e.dataTransfer.setData("pieceId", piece.id);
                                                                    setIsDragging(piece.id);
                                                                }}
                                                            >
                                                                <PuzzleTestPiece label={piece.text} type={targetType} colorClass={getPieceColor(piece.color)} scale={1} id={piece.id} showSeamLine fontFamily={settings.fontFamily} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Audio Button & Checkmark - Standardized Group */}
                                    <div className="relative flex items-center shrink-0 ml-4">
                                        {audioEnabled && (
                                            <button
                                                onClick={() => speak(audioText)}
                                                className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all ring-4 ring-white/50 hover:scale-105 active:scale-95 z-10"
                                                title="Anhören"
                                            >
                                                <Volume2 size={24} />
                                            </button>
                                        )}

                                        {/* Floating Checkmark - positioned exactly 20px to the right of the speaker */}
                                        <div className={`
                                            absolute left-full transition-all duration-500 ease-out z-30 pointer-events-none flex items-center
                                            ${isComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                        `} style={{ paddingLeft: '20px' }}>
                                            <CheckCircle2 className="text-green-500 drop-shadow-2xl" style={{ width: '56px', height: '56px' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Spacer for bottom scrolling */}
                        <div className="h-20 w-full" />
                    </div>
                </div>

                {/* RIGHT SIDEBAR (End Pieces) */}
                <div className="w-[180px] bg-slate-100/50 border-l border-slate-200 flex flex-col shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const pid = e.dataTransfer.getData("pieceId");
                        if (pid) handleReturnToPool(pid);
                    }}
                >
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase">Ende</div>
                    <div className="flex-1 overflow-y-auto p-4 content-center gap-4 flex flex-col items-center">
                        {rightVisible.map(p => (
                            <div key={p.id} className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                draggable onDragStart={(e) => { e.dataTransfer.setData("pieceId", p.id); setIsDragging(p.id); }} onDragEnd={() => setIsDragging(null)}>
                                <PuzzleTestPiece label={p.text} type="zigzag-right" colorClass={getPieceColor(p.color)} scale={gameState.pieceScale * 0.8} fontFamily={settings.fontFamily} onDragStart={() => { }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};
