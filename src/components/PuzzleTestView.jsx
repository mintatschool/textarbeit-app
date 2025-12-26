import React, { useState, useEffect } from 'react';
import {
    Maximize2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';

export const PuzzleTestView = ({ words, onClose }) => {
    // State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [activeLengths, setActiveLengths] = useState([]);
    const [slots, setSlots] = useState({}); // Key: "length-rowIdx" -> piece
    const [completedWords, setCompletedWords] = useState([]); // List of completed word strings
    const [isSuccess, setIsSuccess] = useState(null); // Length of the word just completed
    const [scale, setScale] = useState(1.0);

    // Initialize game logic
    useEffect(() => {
        if (!words || words.length === 0) return;

        // 1. Filter valid words (>= 2 syllables)
        // Ensure they have valid structure
        const validWords = words
            .filter(w => w.syllables && w.syllables.length >= 2 && w.syllables.every(s => s && typeof s === 'string'))
            .map(w => ({
                ...w,
                // Ensure ID
                id: w.id || Math.random().toString(36).substr(2, 9)
            }));

        if (validWords.length === 0) {
            // Handled by rendering check
            setActiveLengths([]);
            return;
        }

        // 2. Identify word lengths present
        const lengths = [...new Set(validWords.map(w => w.syllables.length))].sort((a, b) => a - b);
        setActiveLengths(lengths);

        // 3. Create pieces
        const newPieces = { left: [], middle: [], right: [] };

        validWords.forEach(word => {
            word.syllables.forEach((syl, index) => {
                const uniqueId = `${word.id}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                const piece = {
                    id: uniqueId,
                    text: syl,
                    wordId: word.id,
                    syllableIndex: index,
                    totalSyllables: word.syllables.length,
                    color: 'bg-blue-500', // Uniform color as requested
                    // Random positions for "scattered" look in zones
                    x: Math.random() * 70 + 5,
                    y: Math.random() * 70 + 10,
                    rotation: (Math.random() - 0.5) * 15
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

        // Scramble
        newPieces.left.sort(() => Math.random() - 0.5);
        newPieces.middle.sort(() => Math.random() - 0.5);
        newPieces.right.sort(() => Math.random() - 0.5);

        setPieces(newPieces);
        setSlots({});
        setCompletedWords([]);
    }, [words]);


    // Handle Drop
    const handleDrop = (pieceId, targetLength, targetIndex) => {
        if (isSuccess) return; // Block interaction during success animation

        // Find piece info
        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(zone => {
            const p = pieces[zone].find(x => x.id === pieceId);
            if (p) { foundPiece = p; }
        });

        if (!foundPiece) return;

        // Validate Compatibility with Slot Position
        const requiredType = targetIndex === 0 ? 'left' : (targetIndex === targetLength - 1 ? 'right' : 'middle');

        if (foundPiece.type !== requiredType) {
            // Invalid drop type
            return;
        }

        const slotKey = `${targetLength}-${targetIndex}`;

        setSlots(prev => {
            const next = { ...prev };
            // If piece was already in a slot, remove it from there
            Object.keys(next).forEach(k => {
                if (next[k] && next[k].id === pieceId) delete next[k];
            });
            next[slotKey] = foundPiece;
            return next;
        });
    };

    // Remove Piece from Slot (return to pool)
    const removePieceFromSlot = (slotKey) => {
        if (isSuccess) return;
        setSlots(prev => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    // Check completion logic
    useEffect(() => {
        // Iterate over active lengths to see if any row is full
        activeLengths.forEach(len => {
            if (isSuccess) return;

            const rowStartIdx = 0; // Only one row per length
            const rowPieces = [];
            let isFull = true;
            for (let i = 0; i < len; i++) {
                const p = slots[`${len}-${i}`];
                if (!p) { isFull = false; break; }
                rowPieces.push(p);
            }

            if (isFull) {
                // Validate Word
                const formedWord = rowPieces.map(p => p.text).join('');

                // Find matching word in source list
                const match = words.find(w => w.syllables.join('') === formedWord);

                if (match) {
                    // Success!
                    speak(match.word);
                    setIsSuccess(len);

                    setTimeout(() => {
                        // Cleanup
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
                        setCompletedWords(prev => [...prev, match.word]);
                    }, 1500);
                }
            }
        });
    }, [slots, activeLengths, words, isSuccess]);


    // Filter Logic for Rendering
    const getVisiblePieces = (zone) => {
        const inSlots = Object.values(slots).map(p => p.id);
        return pieces[zone].filter(p => !inSlots.includes(p.id));
    };

    // --- RENDER ---

    if (!activeLengths.length && words && words.length > 0) {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine geeigneten Wörter gefunden.</h2>
                <p className="text-slate-600 mb-6">Bitte markiere Wörter mit mindestens 2 Silben.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Zurück</button>
            </div>
        );
    }

    // Calculate total layout width for scaling if needed, but we scroll vertically

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.Puzzle className="text-blue-600 w-8 h-8" />
                    <span className="text-xl font-bold text-slate-800">Puzzletest</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Scale Slider */}
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-200 hidden sm:flex">
                        <Maximize2 className="w-4 h-4 text-blue-400" />
                        <input type="range" min="0.6" max="1.2" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-24 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>

                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* LEFT ZONE */}
                <div className="w-1/5 bg-slate-100/50 border-r border-slate-200 relative overflow-hidden flex flex-col">
                    <div className="absolute top-2 left-2 text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 w-full text-center">Anfang</div>
                    <div className="flex-1 w-full relative">
                        {getVisiblePieces('left').map(p => (
                            <div key={p.id}
                                className="absolute transition-transform hover:z-50 cursor-grab active:cursor-grabbing"
                                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="left"
                                    colorClass={p.color}
                                    onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE ZONE + CENTER */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Top strip for Middle Pieces */}
                    <div className="h-1/5 min-h-[140px] bg-slate-50 border-b border-slate-200 relative overflow-hidden w-full flex-shrink-0">
                        <div className="absolute top-2 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10">Mitte</div>
                        <div className="w-full h-full relative">
                            {getVisiblePieces('middle').map(p => (
                                <div key={p.id}
                                    className="absolute transition-transform hover:z-50 cursor-grab active:cursor-grabbing"
                                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                    <PuzzleTestPiece
                                        id={p.id}
                                        label={p.text}
                                        type="middle"
                                        colorClass={p.color}
                                        onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Templates Area */}
                    <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center gap-16">
                        {activeLengths.map(len => (
                            <div key={len} className="flex flex-col items-center gap-4 w-full animate-fadeIn">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{len} Silben</span>

                                <div className={`
                                    relative flex items-center justify-center p-6 rounded-[2rem] transition-all duration-500
                                    ${isSuccess === len ? 'bg-emerald-50 scale-105 ring-4 ring-emerald-100' : 'bg-slate-50 border-2 border-dashed border-slate-200'}
                                `}>
                                    <div className="flex items-center -space-x-5">
                                        {Array.from({ length: len }).map((_, idx) => {
                                            const slotKey = `${len}-${idx}`;
                                            const piece = slots[slotKey];
                                            const type = idx === 0 ? 'left' : (idx === len - 1 ? 'right' : 'middle');

                                            return (
                                                <div
                                                    key={idx}
                                                    className="relative flex items-center justify-center z-0 transition-all"
                                                    style={{
                                                        width: `${145 * scale}px`,
                                                        height: `${110 * scale}px`,
                                                        zIndex: idx
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const id = e.dataTransfer.getData("application/puzzle-piece-id");
                                                        handleDrop(id, len, idx);
                                                    }}
                                                >
                                                    {/* Empty Slot Ghost */}
                                                    {!piece && (
                                                        <div className="opacity-20 pointer-events-none">
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

                                    {/* Success Validation Icon */}
                                    {isSuccess === len && (
                                        <div className="absolute -right-16 top-1/2 -translate-y-1/2 animate-bounce">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Spacer at bottom */}
                        <div className="h-32 w-full" />
                    </div>
                </div>

                {/* RIGHT ZONE */}
                <div className="w-1/5 bg-slate-100/50 border-l border-slate-200 relative overflow-hidden flex flex-col">
                    <div className="absolute top-2 right-2 text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 w-full text-center">Ende</div>
                    <div className="flex-1 w-full relative">
                        {getVisiblePieces('right').map(p => (
                            <div key={p.id}
                                className="absolute transition-transform hover:z-50 cursor-grab active:cursor-grabbing"
                                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="right"
                                    colorClass={p.color}
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
