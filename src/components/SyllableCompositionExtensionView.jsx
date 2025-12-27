
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Maximize2,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Volume2,
    Minus,
    Plus
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';

const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-4 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);

export const SyllableCompositionExtensionView = ({ words, settings, onClose, title }) => {
    // Game Configuration
    const [gameState, setGameState] = useState({
        stages: [],
        currentStageIndex: 0,
        gameStatus: 'loading',
        pieceScale: 1.0,
        wordsPerStage: 3
    });

    const [pendingWordsCount, setPendingWordsCount] = useState(3);
    const debounceTimerRef = useRef(null);
    const [activeLengths, setActiveLengths] = useState([]); // Needed for drop logic compatibility? No, we use stage items.

    // State for Pieces & Slots
    // scrambledPieces: Array of { id, text, type, color, ... }
    // placedPieces: Object { "targetId-slotIdx": pieceId }
    const [scrambledPieces, setScrambledPieces] = useState({ left: [], middle: [], right: [] });
    const [placedPieces, setPlacedPieces] = useState({});
    const [completedTargets, setCompletedTargets] = useState(new Set()); // Set of Target IDs

    const moveTimerRef = useRef(null);

    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);

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

        setCompletedTargets(new Set());
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
        setCompletedTargets(new Set());

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

        // Determine destination type requirement
        // We know targetId and slotIndex. We need to find the Target Definition to know length/type?
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
        setPlacedPieces(prev => ({ ...prev, [slotKey]: foundPiece }));

        // Remove from pool (locally tracked by filtering out placed keys in render, but state update safer)
        // No, keep in scrambled as 'source of truth' but filter in UI?
        // Or remove? Removing is cleaner.
        // setScrambledPieces(prev => ({
        //     ...prev,
        //     [sourcePool]: prev[sourcePool].filter(x => x.id !== pieceId)
        // }));
        // BUT: If we remove, we can't easily return it. 
        // Better: Keep distinct list of 'placed pieces' (by ID) vs 'pool pieces'.
        // Let's use `placedPieces` map. Render function will exclude placed IDs from pools.
    };

    const handleRemove = (targetId, slotIndex) => {
        const slotKey = `${targetId}-${slotIndex}`;
        if (completedTargets.has(targetId)) return; // Locked
        setPlacedPieces(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    // --------------------------------------------------------------------------------
    // 5. VALIDATION
    // --------------------------------------------------------------------------------
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];

        // check each target
        currentStage.items.forEach(target => {
            if (completedTargets.has(target.id)) return;

            // Check if all slots filled
            let isFull = true;
            let currentParts = [];
            for (let i = 0; i < target.parts.length; i++) {
                const p = placedPieces[`${target.id}-${i}`];
                if (!p) { isFull = false; break; }
                currentParts.push(p.text);
            }

            if (isFull) {
                // Validate Content
                // Strict: Must match intended parts exactly? 
                // Or loose: Concatenation matches full word? (And form valid structure?)
                // Since user sees specific "Target Rows", usually the intention is to rebuild THAT specific word.
                // But if parts are identical ("en" vs "en"), swapping is fine.
                // Check joined string.
                const formed = currentParts.join('');
                if (formed === target.full) {
                    // Success!
                    speak(formed);
                    setCompletedTargets(prev => new Set(prev).add(target.id));
                }
            }
        });
    }, [placedPieces, completedTargets, gameState.stages, gameState.currentStageIndex]);

    // Check Stage Complete
    useEffect(() => {
        if (!gameState.stages[gameState.currentStageIndex]) return;
        const currentStage = gameState.stages[gameState.currentStageIndex];

        if (currentStage.items.length > 0 && currentStage.items.every(t => completedTargets.has(t.id))) {
            // Stage Complete
            const timer = setTimeout(() => {
                if (gameState.currentStageIndex < gameState.stages.length - 1) {
                    setGameState(prev => ({
                        ...prev,
                        currentStageIndex: prev.currentStageIndex + 1
                    }));
                } else {
                    setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [completedTargets, gameState.stages, gameState.currentStageIndex]);


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
                <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">Fantastisch!</h2>
                <p className="text-slate-600 mb-8 text-xl">Alle Silben gebaut.</p>
                <div className="flex gap-4">
                    <button onClick={() => startNewGame()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all flex items-center gap-2">
                        <RotateCcw /> Noch einmal
                    </button>
                    <button
                        onClick={() => currentStageInfo?.words?.[currentTargetIdx] && speak(currentStageInfo.words[currentTargetIdx].fullWord)}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 mb-10 shrink-0"
                    >
                        <Volume2 className="w-7 h-7" />
                    </button>
                    <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-2xl font-bold shadow-sm text-lg hover:bg-slate-50 transition-all">Beenden</button>
                </div>
            </div>
        );
    }

    if (gameState.gameStatus === 'loading') {
        return <div className="fixed inset-0 bg-white z-[100]" />;
    }

    if (!gameState.stages[gameState.currentStageIndex]) {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Silben gefunden</h2>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl mt-4">Zurück</button>
            </div>
        );
    }

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
                    <Icons.PuzzleZigzag className="text-blue-600 w-8 h-8" />
                    <span className="text-xl font-bold text-slate-800 hidden md:inline">{title || "Silbenbau 2"}</span>

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

            <div className="flex-1 relative flex overflow-hidden">
                {/* LEFT SIDEBAR (Start Pieces) */}
                <div className="w-[180px] bg-slate-100/50 border-r border-slate-200 flex flex-col shrink-0">
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase">Anfang</div>
                    <div className="flex-1 overflow-y-auto p-4 content-center gap-4 flex flex-col items-center">
                        {leftVisible.map(p => (
                            <div key={p.id} className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                draggable onDragStart={(e) => e.dataTransfer.setData("pieceId", p.id)}>
                                <PuzzleTestPiece label={p.text} type="zigzag-left" colorClass={p.color} scale={gameState.pieceScale * 0.8} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Middle Pieces Pool (Top Strip) */}
                    <div className="h-[25%] bg-blue-50/30 border-b border-blue-100 relative w-full overflow-hidden shrink-0">
                        <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-400 uppercase">Mitte</div>
                        <div className="w-full h-full relative p-4">
                            {middleVisible.map(p => (
                                <div key={p.id}
                                    className="absolute cursor-grab active:cursor-grabbing hover:z-50 transition-transform"
                                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)` }}
                                    draggable onDragStart={(e) => e.dataTransfer.setData("pieceId", p.id)}
                                >
                                    <PuzzleTestPiece label={p.text} type="zigzag-middle" colorClass={p.color} scale={gameState.pieceScale * 0.8} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TARGETS LIST */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8 bg-slate-50/30">
                        {currentStage.items.map(target => {
                            const isComplete = completedTargets.has(target.id);
                            return (
                                <div key={target.id} className={`flex items-center gap-4 transition-all duration-500 ${isComplete ? 'opacity-80 scale-95' : ''}`}>
                                    {/* Audio/Status Button - Styled like Silbenbau 1 */}
                                    <button
                                        onClick={() => speak(target.full)}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ring-4 ring-white/50 translate-y-[-6px] hover:scale-105 active:scale-95 ${isComplete
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                    >
                                        {isComplete ? <CheckCircle2 size={24} /> : <Volume2 size={24} />}
                                    </button>

                                    {/* Slot Row */}
                                    <div className="flex items-center gap-0 ml-8" style={{ transform: `scale(${gameState.pieceScale})`, transformOrigin: 'left center', height: 110 }}>
                                        {Array.from({ length: target.parts.length }).map((_, idx) => {
                                            const slotKey = `${target.id}-${idx}`;
                                            const piece = placedPieces[slotKey];
                                            const isStart = idx === 0;
                                            const isEnd = idx === target.parts.length - 1;

                                            // Layout Adjustment for Zigzag overlap
                                            // Scale is handled by parent container mostly, but overlap needs pixels.
                                            // Overlap: 30px (standard base)
                                            const overlap = 30;
                                            const marginLeft = idx === 0 ? 0 : -overlap;

                                            const targetType = isStart ? 'zigzag-left' : (isEnd ? 'zigzag-right' : 'zigzag-middle');

                                            return (
                                                <div
                                                    key={idx}
                                                    className="relative flex items-center justify-center group"
                                                    style={{
                                                        width: 200, height: 110, // Base size matching Piece component
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
                                                            <PuzzleTestPiece label="" type={targetType} isGhost scale={1} />
                                                        </div>
                                                    )}
                                                    {piece && (
                                                        <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => handleRemove(target.id, idx)}>
                                                            <PuzzleTestPiece label={piece.text} type={targetType} colorClass={piece.color} scale={1} id={piece.id} showSeamLine />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Spacer for bottom scrolling */}
                        <div className="h-20 w-full" />
                    </div>
                </div>

                {/* RIGHT SIDEBAR (End Pieces) */}
                <div className="w-[180px] bg-slate-100/50 border-l border-slate-200 flex flex-col shrink-0">
                    <div className="bg-slate-200/50 py-1 text-center text-[10px] font-bold text-slate-400 uppercase">Ende</div>
                    <div className="flex-1 overflow-y-auto p-4 content-center gap-4 flex flex-col items-center">
                        {rightVisible.map(p => (
                            <div key={p.id} className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                draggable onDragStart={(e) => e.dataTransfer.setData("pieceId", p.id)}>
                                <PuzzleTestPiece label={p.text} type="zigzag-right" colorClass={p.color} scale={gameState.pieceScale * 0.8} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
