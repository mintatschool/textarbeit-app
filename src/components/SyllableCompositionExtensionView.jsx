import React, { useState, useEffect, useMemo } from 'react';
import {
    Maximize2,
    CheckCircle2,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';
import availableSyllables from '../utils/available_syllables.json';

export const SyllableCompositionExtensionView = ({ words, settings, onClose }) => {
    // State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [activeLengths, setActiveLengths] = useState([]);
    const [slots, setSlots] = useState({}); // Key: "length-rowIdx" -> piece
    const [completedSyllables, setCompletedSyllables] = useState([]);
    const [isSuccess, setIsSuccess] = useState(null);
    const [scale, setScale] = useState(1.0);

    const allowedClusters = useMemo(() => new Set(settings.clusters || []), [settings.clusters]);

    // Initialize game logic based on Syllables (NOT whole words)
    useEffect(() => {
        if (!availableSyllables) return;

        let audioSet = new Set();
        try {
            const raw = (availableSyllables && Array.isArray(availableSyllables) ? availableSyllables : (availableSyllables?.default || []));
            if (Array.isArray(raw)) {
                audioSet = new Set(raw.map(s => (s && typeof s === 'string') ? s.toLowerCase().trim() : ''));
            }
        } catch (e) {
            console.warn("Syllable audio list error", e);
        }

        const validSyllableParts = [];
        const seen = new Set();

        // 1. Extract syllables from MARKED words
        let candidateSyllables = [];
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w && Array.isArray(w.syllables)) {
                    w.syllables.forEach(s => {
                        if (typeof s === 'string') candidateSyllables.push(s);
                    });
                }
            });
        }

        // 2. Filter loop
        candidateSyllables.forEach(syl => {
            if (!syl || typeof syl !== 'string') return;
            const cleanSyl = syl.toLowerCase().trim();
            if (cleanSyl.length < 2) return;
            if (seen.has(cleanSyl)) return;

            // OPTIONAL: Check if audio exists (warn but don't block)
            // if (!audioSet.has(cleanSyl)) return;

            // SPLIT LOGIC: Decompose syllable into parts (Letters + Clusters)
            // Example: "schau" -> "sch", "au" (2 parts)
            // "Haus" -> "H", "au", "s" (3 parts)

            let parts = [];
            let remaining = cleanSyl;

            // Greedy consumption from left
            while (remaining.length > 0) {
                let foundCluster = false;
                // Check for clusters starting at 0
                // We need to check longest match first if clusters can overlap 
                // (e.g. 'sch' vs 'sc' - though usually distinct).
                // Our settings.clusters is a simple array.
                // Sort allowedClusters by length desc for greedy match might be safer, but 
                // typical usage is standard German digraphs/trigraphs.

                // Let's iterate all clusters and see if one matches the start
                // Convert Set to Array for iteration
                const clusterList = Array.from(allowedClusters).sort((a, b) => b.length - a.length);

                for (let cluster of clusterList) {
                    if (remaining.startsWith(cluster)) {
                        parts.push(cluster);
                        remaining = remaining.substring(cluster.length);
                        foundCluster = true;
                        break;
                    }
                }

                if (!foundCluster) {
                    // Consume 1 char
                    parts.push(remaining[0]);
                    remaining = remaining.substring(1);
                }
            }

            if (parts.length >= 2) {
                validSyllableParts.push({
                    full: cleanSyl,
                    parts: parts,
                    id: cleanSyl + '-' + Math.random().toString(36).substr(2, 5)
                });
                seen.add(cleanSyl);
            }
        });

        if (validSyllableParts.length === 0) {
            setActiveLengths([]);
            return;
        }

        const lengths = [...new Set(validSyllableParts.map(s => s.parts.length))].sort((a, b) => a - b);
        setActiveLengths(lengths);

        const newPieces = { left: [], middle: [], right: [] };

        const getMiddleGridPos = (index, total) => {
            const spacing = 90 / (total || 1);
            return {
                x: 5 + (index * spacing),
                y: 10 + (Math.random() * 20)
            };
        };

        validSyllableParts.forEach(sylObj => {
            sylObj.parts.forEach((partText, index) => {
                const uniqueId = `${sylObj.id}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                const piece = {
                    id: uniqueId,
                    text: partText,
                    syllableId: sylObj.id,
                    partIndex: index,
                    totalParts: sylObj.parts.length,
                    color: 'bg-blue-500',
                    rotation: (Math.random() - 0.5) * 4,
                    sortIndex: Math.random()
                };

                if (index === 0) {
                    newPieces.left.push({ ...piece, type: 'zigzag-left' });
                } else if (index === sylObj.parts.length - 1) {
                    newPieces.right.push({ ...piece, type: 'zigzag-right' });
                } else {
                    newPieces.middle.push({ ...piece, type: 'zigzag-middle' });
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
        setSlots({});
        setCompletedSyllables([]);
    }, [words, allowedClusters]); // Re-run when words or clusters change


    // Handle Drop
    const handleDrop = (pieceId, targetLength, targetIndex) => {
        if (isSuccess) return;

        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(zone => {
            const p = pieces[zone].find(x => x.id === pieceId);
            if (p) { foundPiece = p; }
        });

        if (!foundPiece) return;

        // Validation: Correct TYPE
        const requiredType = targetIndex === 0 ? 'zigzag-left' : (targetIndex === targetLength - 1 ? 'zigzag-right' : 'zigzag-middle');
        if (foundPiece.type !== requiredType) return;

        const slotKey = `${targetLength}-${targetIndex}`;

        setSlots(prev => {
            const next = { ...prev };
            // Remove piece if it was elsewhere? Actually Pieces list is source of truth for sidebar, Slots for board.
            // If piece is already in A slot, remove it from there.
            Object.keys(next).forEach(k => {
                if (next[k] && next[k].id === pieceId) delete next[k];
            });
            next[slotKey] = foundPiece;
            return next;
        });
    };

    const removePieceFromSlot = (slotKey) => {
        if (isSuccess) return;
        setSlots(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    // Check for success condition
    useEffect(() => {
        activeLengths.forEach(len => {
            if (isSuccess) return;

            const rowPieces = [];
            let isFull = true;
            for (let i = 0; i < len; i++) {
                const p = slots[`${len}-${i}`];
                if (!p) { isFull = false; break; }
                rowPieces.push(p);
            }

            if (isFull) {
                const formedSyllable = rowPieces.map(p => p.text).join('');

                // Validate against Audio List implicitly via our generation logic?
                // Or just check if it was one of the generated ones?
                // Simplest: Check if the formed string exists in availableSyllables
                // But we must also check if the PARTS match the structure?
                // E.g. "Sch" + "au" = "Schau". "S" + "ch" + "au" = "Schau".
                // If user put S-ch-au (3 parts) into the 3-slot row -> Correct.
                // If user put Sch-au (2 parts) into the 2-slot row -> Correct.

                // We trust the `availableSyllables` list check done at init.
                // So if "formedSyllable" is in our valid set (re-check or trust init).
                // Let's re-verify existence in audio list to be safe.

                const isValid = (availableSyllables?.default || availableSyllables || []).includes(formedSyllable.toLowerCase());

                if (isValid) {
                    speak(formedSyllable);
                    setIsSuccess(len);

                    setTimeout(() => {
                        setPieces(prev => {
                            const next = { ...prev };
                            ['left', 'middle', 'right'].forEach(zone => {
                                next[zone] = next[zone].filter(p => !rowPieces.some(used => used.id === p.id));
                            });
                            return next;
                        });

                        setSlots(prev => {
                            const next = { ...prev };
                            for (let i = 0; i < len; i++) delete next[`${len}-${i}`];
                            return next;
                        });

                        setIsSuccess(null);
                        setCompletedSyllables(prev => {
                            return [...prev, formedSyllable];
                        });
                    }, 2000);
                }
            }
        });
    }, [slots, activeLengths, isSuccess]);

    const getVisiblePieces = (zone) => {
        const inSlots = Object.values(slots).map(p => p.id);
        return pieces[zone].filter(p => !inSlots.includes(p.id));
    };

    const getSlotStyles = (piece, index) => {
        const base = 200;
        // Approximation of width if piece is present, else standard
        const pieceWidth = (piece && piece.text && piece.text.length > 5) ? (base + (piece.text.length - 5) * 20) : base;
        const stretchX = pieceWidth / base;
        const overlap = 30 * stretchX * scale; // Overlap for Zigzag

        return {
            width: `${pieceWidth * scale}px`,
            height: `${110 * scale}px`,
            marginLeft: index === 0 ? 0 : `-${overlap}px`,
            zIndex: index === 0 ? 20 : (20 - index) // First piece triggers overlap? Logic must match Zigzag: Left (hole) < Middle < Right (point)?
            // Zigzag Left has Hole on Right. Zigzag Middle has Point on Left.
            // So Middle must be ON TOP of Left to cover the hole? Or Left on top?
            // Visual: Left Piece ends with HOLE. Middle Piece starts with POINT.
            // Usually Point goes INTO Hole. So Piece with Point should be UNDER Piece with Hole?
            // Wait, Standard Puzzle: Left (Knob) -> Right (Hole). Left is ON TOP.

            // Zigzag Left:  Ends in Point (Knob).
            // Zigzag Right: Starts with Indent (Hole).
            // So default Zigzag: Left is ON TOP of Right.

            // Middle Piece: Starts with Indent (Hole-Left), Ends with Point (Knob-Right).
            // Interactions:
            // Zigzag Left (Point) -> Middle (Hole). Left ON TOP of Middle.
            // Middle (Point) -> Zigzag Right (Hole). Middle ON TOP of Right.

            // So Stack Order: Left (High) > Middle (Med) > Right (Low).
            // Decreasing Z-Index from Left to Right is correct.
        };
    };

    if (!activeLengths.length && words && words.length > 0) {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Silben gefunden.</h2>
                <p className="text-slate-600 mb-6">Markierte Wörter müssen Silben haben, die zerlegbar sind.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Zurück</button>
            </div>
        );
    }

    // Determine if all cleared? 
    // We check if pieces are empty? Or if no more tasks?
    const allCleared = pieces.left.length === 0 && pieces.middle.length === 0 && pieces.right.length === 0 && !isSuccess;

    if (allCleared && completedSyllables.length > 0) {
        return (
            <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">Fantastisch!</h2>
                <p className="text-slate-600 mb-8 text-xl">Alle Silben gebaut.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all">Fertig</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.PuzzleZigzag className="text-blue-600 w-8 h-8" />
                    <span className="text-xl font-bold text-slate-800">Silbenbau (Profi)</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-200 hidden sm:flex">
                        <Maximize2 className="w-4 h-4 text-blue-400" />
                        <input type="range" min="0.6" max="1.3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-24 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* LEFT ZONE */}
                <div className="w-1/5 bg-slate-100/50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100/90 py-2 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 border-b border-slate-200 shrink-0">Anfang</div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 no-scrollbar">
                        {getVisiblePieces('left').map(p => (
                            <div key={p.id}
                                className="flex justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing transform-gpu"
                                style={{ transform: `scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="zigzag-left"
                                    colorClass={p.color}
                                    scale={scale}
                                    onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE ZONE + CENTER */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Middle Pool Strip */}
                    <div className="h-[35%] bg-slate-50 border-b-2 border-slate-100 relative overflow-hidden w-full flex-shrink-0 z-10">
                        <div className="absolute top-2 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10">Mitte</div>
                        <div className="w-full h-full relative">
                            {getVisiblePieces('middle').map(p => (
                                <div key={p.id}
                                    className="absolute transition-transform hover:z-50 cursor-grab active:cursor-grabbing"
                                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                    <PuzzleTestPiece
                                        id={p.id}
                                        label={p.text}
                                        type="zigzag-middle"
                                        colorClass={p.color}
                                        scale={scale}
                                        onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Workspace */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4 w-full mt-6 no-scrollbar pb-32">
                        {activeLengths.map(len => (
                            <div key={len} className="flex flex-col items-center gap-3 w-full animate-fadeIn shrink-0">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{len} Teile</span>

                                <div className={`
                                    relative flex items-center justify-center transition-all duration-500 py-4
                                    ${isSuccess === len ? 'scale-105' : ''}
                                `}>
                                    <div className="flex items-center">
                                        {Array.from({ length: len }).map((_, idx) => {
                                            const slotKey = `${len}-${idx}`;
                                            const piece = slots[slotKey];
                                            const type = idx === 0 ? 'zigzag-left' : (idx === len - 1 ? 'zigzag-right' : 'zigzag-middle');
                                            const slotStyles = getSlotStyles(piece, idx);

                                            return (
                                                <div
                                                    key={idx}
                                                    className="relative flex items-center justify-center transition-all duration-300 group"
                                                    style={slotStyles}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const id = e.dataTransfer.getData("application/puzzle-piece-id");
                                                        handleDrop(id, len, idx);
                                                    }}
                                                >
                                                    {/* Empty Slot Ghost */}
                                                    {!piece && (
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                            <PuzzleTestPiece
                                                                label=""
                                                                type={type}
                                                                isGhost={true}
                                                                scale={scale}
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
                                        ${isSuccess === len ? 'scale-125 opacity-100 translate-x-12' : 'scale-0 opacity-0 translate-x-0'}
                                    `} style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}>
                                        <CheckCircle2 className="text-emerald-500 drop-shadow-2xl" style={{ width: `${80 * scale}px`, height: `${80 * scale}px` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT ZONE */}
                <div className="w-1/5 bg-slate-100/50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100/90 py-2 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 border-b border-slate-200 shrink-0">Ende</div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 no-scrollbar">
                        {getVisiblePieces('right').map(p => (
                            <div key={p.id}
                                className="flex justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing transform-gpu"
                                style={{ transform: `scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="zigzag-right"
                                    colorClass={p.color}
                                    scale={scale}
                                    onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
