import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { RewardModal } from './shared/RewardModal';
import { EmptyStateMessage } from './EmptyStateMessage';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { getCorrectCasing } from '../utils/wordCasingUtils';
// Removed mobile-drag-drop polyfill import/init as it's replaced by pointer events
export const AlphabetSortingView = ({ words, onClose, settings, setSettings, title, wordColors = {}, highlightedIndices = new Set(), hideYellowLetters = false }) => {
    // Ensure we have words
    if (!words || words.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
                <EmptyStateMessage onClose={onClose} message="Keine Wörter markiert!" />
            </div>
        );
    }

    const [pieces, setPieces] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, correct, wrong
    const [isShaking, setIsShaking] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // iPad Fix: Prevent touch scrolling during drag is now handled by usePointerDrag

    // Initialize
    useEffect(() => {
        // Prepare initial pieces from passed words
        // We use the 'word' property of the word objects
        const initialPieces = words.map((w, idx) => {
            const correctedWord = getCorrectCasing(w.word);
            return {
                id: `word-${idx}-${correctedWord}`, // Unique ID
                text: correctedWord,
                originalObject: w,
                // The correct alphabetical index will be determined by sorting the array
            };
        });

        // Determine correct alphabetical order for validation
        // We sort a COPY to determine the target order
        const sortedTarget = [...initialPieces].sort((a, b) => a.text.localeCompare(b.text, 'de', { sensitivity: 'base' }));

        // Map pieces to their target index
        const piecedWithTargetIndex = initialPieces.map(p => ({
            ...p,
            targetIndex: sortedTarget.findIndex(t => t.id === p.id)
        }));

        // Shuffle for the game
        const shuffled = [...piecedWithTargetIndex];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setPieces(shuffled);
        setStatus('idle');
    }, [words]);



    // Since the logic is specific (toggle individually, auto-group on activate),
    // let's change state to an array of active flags.
    // 1-indexed for convenience in thought process, 0-indexed in code.
    const [activeHighlights, setActiveHighlights] = useState([false, false, false, false]); // [1st, 2nd, 3rd, 4th]

    const handleButtonClick = (index) => {
        // index is 0..3 (representing buttons 1..4)
        const newHighlights = [...activeHighlights];

        if (newHighlights[index]) {
            // Deactivate ONLY this one
            newHighlights[index] = false;
        } else {
            // Activate this one AND all below it
            for (let i = 0; i <= index; i++) {
                newHighlights[i] = true;
            }
        }
        setActiveHighlights(newHighlights);
    };

    // Drag & Drop via usePointerDrag
    const handleDrop = (dragItem, targetId) => {
        // dragItem contains the piece object and original index (sourceId)
        // targetId is the index of the slot dropped onto (string or number from registerDropZone)

        const sourceIndex = dragItem.sourceIndex;
        const targetIndex = Number(targetId);

        if (sourceIndex !== targetIndex && !isNaN(targetIndex)) {
            const newPieces = [...pieces];
            const draggedContent = newPieces[sourceIndex];
            newPieces.splice(sourceIndex, 1);
            newPieces.splice(targetIndex, 0, draggedContent);
            setPieces(newPieces);
            setStatus('idle');
        }
    };

    const { getDragProps, registerDropZone, dragState, isDragging: isPointerDragging } = usePointerDrag({
        onDrop: handleDrop
    });

    // Auto-scroll logic (Restored for Pointer Events)
    const scrollContainerRef = useRef(null);
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!isPointerDragging || !dragState || !container) return;

        const handleAutoScroll = () => {
            const { y } = dragState.pos;
            const r = container.getBoundingClientRect();
            const edge = 80;
            const speed = 10;
            if (y < r.top + edge) container.scrollTop -= speed;
            else if (y > r.bottom - edge) container.scrollTop += speed;
        };

        const interval = setInterval(handleAutoScroll, 20);
        return () => clearInterval(interval);
    }, [isPointerDragging, dragState]);

    // iPad Touch Scroll Prevention is handled inside usePointerDrag now
    // Old manual handlers (handleDragStart, handleDragEnter, handleDragEnd, handleContainerDragOver) removed

    const checkOrder = () => {
        const currentTexts = pieces.map(p => p.text);
        // Determine correct sorted order based on the CURRENT text values
        const sortedTexts = [...currentTexts].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));

        // Check if all are correct
        const allCorrect = currentTexts.every((text, index) => text === sortedTexts[index]);

        if (allCorrect) {
            setStatus('correct');
        } else {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);

            // Trigger shake
            const container = document.getElementById('puzzle-container');
            if (container) {
                container.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 400 });
            }
        }
    };

    const HIGHLIGHT_COLORS = [
        'bg-orange-200', // 1st char
        'bg-blue-200',   // 2nd char
        'bg-green-200',  // 3rd char
        'bg-purple-200'  // 4th char
    ];

    // Helper to render label with highlights
    const renderLabel = (index) => {
        const word = "Liste";
        const targetIndices = []; // 0 to index
        for (let i = 0; i <= index; i++) targetIndices.push(i);

        return (
            <div className="flex font-bold text-lg tracking-widest text-slate-600">
                {word.split('').map((char, charIdx) => {
                    const colorClass = (charIdx <= index) ? HIGHLIGHT_COLORS[charIdx] : 'transparent';
                    // Label highlights are static based on button ID, not state
                    return (
                        <span key={charIdx} className={`px-0.5 rounded ${colorClass} transition-colors`}>
                            {char}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            <RewardModal
                isOpen={status === 'correct'}
                onClose={onClose}
                message="Richtig sortiert!"
            />

            <header className="bg-white px-6 py-4 shadow-sm flex flex-col md:flex-row items-center z-10 shrink-0 gap-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.SortAsc className="text-blue-500" />
                        {title || 'Alphabetisch sortieren'}
                    </h2>
                </div>

                {/* Highlight Controls - Moved closer to title */}
                <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 items-center overflow-x-auto max-w-full">
                    {[0, 1, 2, 3].map((idx) => (
                        <button
                            key={idx}
                            onClick={() => handleButtonClick(idx)}
                            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2 transition-all min-w-[5rem] ${activeHighlights[idx] ? 'bg-white border-blue-500 shadow-md transform scale-105' : 'bg-slate-100 border-transparent hover:bg-slate-200 opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-xl font-bold text-slate-400 mb-0.5 w-full text-right leading-none">{idx + 1}.</span>
                            {renderLabel(idx)}
                        </button>
                    ))}
                </div>

                <div className="flex-1" /> {/* Spacer to push settings to right */}

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-24 accent-blue-600 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </header>

            {/* CONTENT */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto custom-scroll p-6 pl-12 pt-2 bg-slate-50/50"
            >
                <div id="puzzle-container" className="max-w-2xl pb-24 transition-transform text-left space-y-2 mt-4">
                    {pieces.map((piece, idx) => {
                        return (
                            <div key={piece.id} className={`flex items-stretch gap-6 transition-transform ${isPointerDragging && dragState?.sourceId === idx ? 'opacity-50' : 'opacity-100'}`}>
                                {/* Ranking Box (Static) */}
                                <div className="flex items-center justify-center px-4 rounded-xl border-2 border-blue-200 bg-blue-50 shadow-sm w-16 shrink-0">
                                    <span className="text-xl font-bold text-blue-600">{idx + 1}.</span>
                                </div>

                                {/* Draggable Word Box */}
                                <div
                                    ref={registerDropZone(idx)}
                                    {...getDragProps({ ...piece, sourceIndex: idx }, idx)}
                                    className={`p-4 pl-3 rounded-xl border-2 shadow-sm transition-all cursor-grab active:cursor-grabbing flex gap-4 items-center select-none bg-white border-slate-200 ${isPointerDragging && dragState?.sourceId === idx ? 'opacity-40' : 'hover:shadow-md hover:bg-blue-50/50'}`}
                                >
                                    {/* Drag Handle */}
                                    <div className="drag-handle text-slate-300 cursor-grab active:cursor-grabbing shrink-0" style={{ touchAction: 'none' }}>
                                        <Icons.MoveVertical size={24} />
                                    </div>
                                    <div
                                        className="flex-1 font-bold text-slate-800"
                                        style={{
                                            fontSize: `${settings.fontSize}px`,
                                            fontFamily: settings.fontFamily
                                        }}
                                    >
                                        {piece.text.split('').map((char, charIdx) => {
                                            // Determine if this character should be highlighted
                                            let highlightClass = '';
                                            if (charIdx < 4 && activeHighlights[charIdx]) {
                                                highlightClass = HIGHLIGHT_COLORS[charIdx];
                                            }

                                            // Support general yellow markings (only if not task-highlighted)
                                            let customStyle = {
                                                width: '0.7em',
                                                marginRight: '0.05em'
                                            };
                                            if (!highlightClass && !hideYellowLetters) {
                                                const globalIdx = piece.originalObject.index + charIdx;
                                                if (wordColors[globalIdx] === 'yellow') {
                                                    highlightClass = 'bg-yellow-200';
                                                    customStyle.borderRadius = '4px';
                                                    customStyle.padding = '0 2px';
                                                } else if (highlightedIndices.has(globalIdx)) {
                                                    highlightClass = 'bg-slate-200';
                                                    customStyle.borderRadius = '4px';
                                                    customStyle.padding = '0 2px';
                                                }
                                            }

                                            return (
                                                <span
                                                    key={charIdx}
                                                    className={`${highlightClass} rounded-sm transition-colors duration-300 inline-block text-center`}
                                                    style={customStyle}
                                                >
                                                    {char}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Drag Overlay */}
            {dragState && (
                <div
                    className="fixed z-[10000] pointer-events-none"
                    style={{
                        left: dragState.pos.x - dragState.offset.x,
                        top: dragState.pos.y - dragState.offset.y,
                        width: dragState.cloneRect.width,
                        height: dragState.cloneRect.height,
                        transform: 'scale(1.03) rotate(1deg)',
                        filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.20))'
                    }}
                >
                    <div className="p-4 pl-3 rounded-xl border-2 border-blue-400 bg-white shadow-xl flex gap-4 items-center h-full">
                        <div className="text-blue-400 shrink-0">
                            <Icons.MoveVertical size={24} />
                        </div>
                        <div
                            className="flex-1 font-bold text-slate-800"
                            style={{
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: settings.fontFamily
                            }}
                        >
                            {dragState.item.text}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
                <button
                    onClick={checkOrder}
                    className={`px-8 py-2.5 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 min-touch-target ${isShaking ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    <Icons.Check size={20} /> Prüfen
                </button>
            </div>
        </div>
    );
};
