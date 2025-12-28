import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

// --- UTILS ---
const splitText = (text, mode) => {
    if (mode === 'sentence') {
        // Mode Sentence: Split by . ! ? followed by whitespace
        // Keep the punctuation with the sentence? 
        // User regex: /(?<=[.!?])\s+/
        return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    } else {
        // Mode Text: Split by Paragraphs (\n\s*\n)
        // User regex: /\n\s*\n/
        // Also handle single newlines if they are meant to be blocks? 
        // User specific regex: /\n\s*\n/ implies blank lines.
        return text.split(/\n\s*\n/).filter(s => s.trim().length > 0);
    }
};

const PASTEL_COLORS = [
    'bg-red-100 border-red-200',
    'bg-orange-100 border-orange-200',
    'bg-amber-100 border-amber-200',
    'bg-yellow-100 border-yellow-200',
    'bg-lime-100 border-lime-200',
    'bg-green-100 border-green-200',
    'bg-emerald-100 border-emerald-200',
    'bg-teal-100 border-teal-200',
    'bg-cyan-100 border-cyan-200',
    'bg-sky-100 border-sky-200',
    'bg-blue-100 border-blue-200',
    'bg-indigo-100 border-indigo-200',
    'bg-violet-100 border-violet-200',
    'bg-purple-100 border-purple-200',
    'bg-fuchsia-100 border-fuchsia-200',
    'bg-pink-100 border-pink-200',
    'bg-rose-100 border-rose-200'
];

export const SentencePuzzleView = ({ text, mode = 'sentence', onClose, settings, setSettings, title }) => {
    if (!text || text.trim().length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);

    const [pieces, setPieces] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, correct, wrong
    const [isDragging, setIsDragging] = useState(false);

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

    // Initialize
    useEffect(() => {
        const rawSegments = splitText(text, mode);

        if (rawSegments.length < 2) {
            // Need at least 2 parts
            alert("Der Text ist zu kurz für dieses Puzzle. Es werden mindestens 2 Sätze oder Absätze benötigt.");
            onClose();
            return;
        }

        const initialPieces = rawSegments.map((seg, idx) => ({
            id: `part-${idx}`,
            text: seg.trim(),
            originalIndex: idx,
            color: PASTEL_COLORS[idx % PASTEL_COLORS.length]
        }));

        // Shuffle
        const shuffled = [...initialPieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setPieces(shuffled);
        setStatus('idle');
    }, [text, mode]);

    // Drag & Drop
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, position) => {
        setIsDragging(true);
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
        // Add dragging class for visuals
        setTimeout(() => e.target.classList.add('dragging'), 0);
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
        e.preventDefault();
        // Add visual indicator
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        e.target.classList.remove('dragging');
        const dI = dragItem.current;
        const dO = dragOverItem.current;

        if (dI !== null && dO !== null && dI !== dO) {
            const newPieces = [...pieces];
            const draggedContent = newPieces[dI];
            newPieces.splice(dI, 1);
            newPieces.splice(dO, 0, draggedContent);
            setPieces(newPieces);
            setStatus('idle');
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const checkOrder = () => {
        const isCorrect = pieces.every((p, i) => p.originalIndex === i);
        if (isCorrect) {
            setStatus('correct');
        } else {
            setStatus('wrong');
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
                ], { duration: 500 });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            {status === 'correct' && (
                <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alles richtig sortiert! Super!
                            </span>
                            <button onClick={onClose} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg min-touch-target">
                                Beenden
                            </button>
                        </div>
                    </div>

                    {/* Confetti */}
                    <div className="fixed inset-0 pointer-events-none z-[160]">
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

            {/* HEADER */}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {mode === 'sentence' ? <Icons.Sentence className="text-pink-500" /> : <Icons.TextBlocks className="text-emerald-500" />}
                        {title || (mode === 'sentence' ? 'Satzpuzzle' : 'Textpuzzle')}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scroll p-6 bg-slate-50/50">
                <div id="puzzle-container" className="max-w-4xl mx-auto space-y-4 pb-24 transition-transform">
                    {pieces.map((piece, idx) => (
                        <div
                            key={piece.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragEnter={(e) => handleDragEnter(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`${piece.color} p-6 rounded-xl border-l-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing flex gap-4 items-start bg-opacity-50 touch-action-none touch-manipulation select-none`}
                        >
                            <div className="mt-1 text-slate-400 font-bold select-none opacity-50 flex flex-col items-center gap-1">
                                <Icons.Move size={20} />
                            </div>
                            <div
                                className="flex-1 text-slate-800 whitespace-pre-wrap leading-relaxed"
                                style={{
                                    fontFamily: settings.fontFamily,
                                    fontSize: `${settings.fontSize}px`
                                }}
                            >
                                {piece.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="absolute bottom-6 right-6 z-50 pointer-events-none">
                {/* Only Check Button here? Or Center it? Design requested Check button. 
                     Let's put it fixed bottom center or similar. 
                     Actually, standard layout puts actions in footer or absolute positions. 
                     Let's use a floating action button style for "Check".
                  */}
            </div>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={checkOrder}
                    className={`px-12 py-4 rounded-full font-bold text-xl shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 min-touch-target ${status === 'wrong' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {status === 'wrong' ? <><Icons.AlertTriangle /> Stimmt nicht ganz</> : 'Prüfen'}
                </button>
            </div>

            {/* Toast Failure */}
            {status === 'wrong' && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-100 border-2 border-red-400 text-red-800 px-6 py-3 rounded-xl shadow-xl font-bold animate-[slideDown_0.3s_ease-out] flex items-center gap-2 z-[200]">
                    <Icons.AlertTriangle /> Die Reihenfolge stimmt noch nicht.
                </div>
            )}
        </div>
    );
};
