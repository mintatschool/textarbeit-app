import React, { useState, useEffect } from 'react';
import {
    Maximize2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Icons } from './Icons';
import PuzzleTestPiece from './PuzzleTestPiece';
import { speak } from '../utils/speech';

export const PuzzleTestMultiSyllableView = ({ words, onClose }) => {
    // State
    const [pieces, setPieces] = useState({ left: [], middle: [], right: [] });
    const [activeLengths, setActiveLengths] = useState([]);
    const [slots, setSlots] = useState({}); // Key: "length-rowIdx" -> piece
    const [completedWords, setCompletedWords] = useState([]);
    const [isSuccess, setIsSuccess] = useState(null);
    const [scale, setScale] = useState(1.0);

    // Initialize game logic
    useEffect(() => {
        if (!words || words.length === 0) return;

        const validWords = words
            .filter(w => w.syllables && w.syllables.length >= 2 && w.syllables.every(s => s && typeof s === 'string'))
            .map(w => ({
                ...w,
                id: w.id || Math.random().toString(36).substr(2, 9)
            }));

        if (validWords.length === 0) {
            setActiveLengths([]);
            return;
        }

        const lengths = [...new Set(validWords.map(w => w.syllables.length))].sort((a, b) => a - b);
        setActiveLengths(lengths);

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

        const allSyllables = [];
        validWords.forEach(word => {
            word.syllables.forEach((syl, index) => {
                const uniqueId = `${word.id}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                const width = getPieceWidth(syl);
                const piece = {
                    id: uniqueId,
                    text: syl,
                    wordId: word.id,
                    syllableIndex: index,
                    totalSyllables: word.syllables.length,
                    color: 'bg-blue-500',
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
        setSlots({});
        setCompletedWords([]);
    }, [words]);


    // Handle Drop
    const handleDrop = (pieceId, targetLength, targetIndex) => {
        if (isSuccess) return;

        let foundPiece = null;
        ['left', 'middle', 'right'].forEach(zone => {
            const p = pieces[zone].find(x => x.id === pieceId);
            if (p) { foundPiece = p; }
        });

        if (!foundPiece) return;

        const requiredType = targetIndex === 0 ? 'left' : (targetIndex === targetLength - 1 ? 'right' : 'middle');
        if (foundPiece.type !== requiredType) return;

        const slotKey = `${targetLength}-${targetIndex}`;

        setSlots(prev => {
            const next = { ...prev };
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
                const formedWord = rowPieces.map(p => p.text).join('');
                const match = words.find(w => w.syllables.join('') === formedWord);

                if (match) {
                    speak(match.word);
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
                        setCompletedWords(prev => {
                            const newCompleted = [...prev, match.word];
                            return newCompleted;
                        });
                    }, 2500);
                }
            }
        });
    }, [slots, activeLengths, words, isSuccess]);

    // Check if we need to remove lengths from display
    const getVisibleLengths = () => {
        // Find which lengths still have words remaining
        // Total words of length L minus Completed words of length L
        const visible = activeLengths.filter(len => {
            const totalOfLen = words.filter(w => w.syllables.length === len).length;
            const completedOfLen = completedWords.filter(cw => {
                const wObj = words.find(w => w.word === cw);
                return wObj && wObj.syllables.length === len;
            }).length;
            return completedOfLen < totalOfLen;
        });
        return visible;
    };


    const getVisiblePieces = (zone) => {
        const inSlots = Object.values(slots).map(p => p.id);
        return pieces[zone].filter(p => !inSlots.includes(p.id));
    };

    // Calculate slot width based on piece and scale
    const getSlotStyles = (piece, index) => {
        const base = 200;
        const pieceWidth = piece ? piece.width : base;
        const stretchX = pieceWidth / base;
        const overlap = 25 * stretchX * scale;

        return {
            width: `${pieceWidth * scale}px`,
            height: `${110 * scale}px`,
            marginLeft: index === 0 ? 0 : `-${overlap}px`,
            zIndex: 10 + (20 - index) // Reverse z-index so left pieces (knobs) sit ON TOP of right pieces (holes)
        };
    };

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

    // Check if ALL done
    const visibleLengths = getVisibleLengths();
    if (visibleLengths.length === 0 && completedWords.length > 0 && !isSuccess) {
        return (
            <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-slate-800 mb-2">Fantastisch!</h2>
                <p className="text-slate-600 mb-8 text-xl">Alle Wörter gepuzzelt.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl text-lg hover:scale-105 transition-all">Fertig</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-blue-50 z-[100] flex flex-col font-sans no-select select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.SyllableTestMulti className="text-blue-600 w-8 h-8" />
                    <span className="text-xl font-bold text-slate-800">Silbenpuzzle</span>
                </div>

                <div className="flex items-center gap-4">
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

                {/* LEFT ZONE - Vertical Scroll Stacking */}
                <div className="w-1/5 bg-slate-100/50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100/90 py-2 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none z-10 border-b border-slate-200 shrink-0">Anfang</div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 no-scrollbar">
                        {getVisiblePieces('left').map(p => (
                            <div key={p.id}
                                className="flex justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing transform-gpu"
                                style={{ transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="left"
                                    colorClass={p.color}
                                    dynamicWidth={p.width}
                                    onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE ZONE + CENTER */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Top strip for Middle Pieces - REDUCED to 40% to give Bottom more space */}
                    <div className="h-[40%] bg-slate-50 border-b-2 border-slate-100 relative overflow-hidden w-full flex-shrink-0 z-10 transition-all duration-300">
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
                                        dynamicWidth={p.width}
                                        onDragStart={(e) => { e.dataTransfer.setData("application/puzzle-piece-id", p.id); }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Templates Area - Flex container to fill remaining space */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4 w-full mt-6 no-scrollbar pb-32">
                        {visibleLengths.map(len => (
                            <div key={len} className="flex flex-col items-center gap-3 w-full animate-fadeIn shrink-0">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{len} Silben</span>

                                <div className={`
                                    relative flex items-center justify-center transition-all duration-500 py-4
                                    ${isSuccess === len ? 'scale-105' : ''}
                                `}>
                                    <div className="flex items-center">
                                        {Array.from({ length: len }).map((_, idx) => {
                                            const slotKey = `${len}-${idx}`;
                                            const piece = slots[slotKey];
                                            const type = idx === 0 ? 'left' : (idx === len - 1 ? 'right' : 'middle');
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
                                                    {/* TRANSPARENT HIT AREA for better tolerance */}
                                                    <div className="absolute inset-[-20px] z-0" />
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
                                                                dynamicWidth={piece.width}
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
                                        ${isSuccess === len ? 'scale-125 opacity-100 translate-x-20' : 'scale-0 opacity-0 translate-x-0'}
                                    `} style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}>
                                        <CheckCircle2 className="text-emerald-500 drop-shadow-2xl w-16 h-16" />
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
                        {getVisiblePieces('right').map(p => (
                            <div key={p.id}
                                className="flex justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing transform-gpu"
                                style={{ transform: `rotate(${p.rotation}deg) scale(${scale})` }}>
                                <PuzzleTestPiece
                                    id={p.id}
                                    label={p.text}
                                    type="right"
                                    colorClass={p.color}
                                    dynamicWidth={p.width}
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
