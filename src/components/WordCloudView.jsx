import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { getChunks } from '../utils/syllables';
import { speak } from '../utils/speech';

export const WordCloudView = ({ words, settings, setSettings, onClose, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [cloudWords, setCloudWords] = useState([]);
    const [placedChunks, setPlacedChunks] = useState({});
    const [poolChunks, setPoolChunks] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [showVowels, setShowVowels] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedChunk, setSelectedChunk] = useState(null); // For Click-to-Place
    const dragItemRef = useRef(null);

    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => { document.body.style.overflow = ''; document.removeEventListener('touchmove', preventDefault); };
    }, [isDragging]);

    const generateSpiralPositions = (chunks, fontSize) => {
        const positions = [];
        const centerX = 50;
        const centerY = 50;
        const sortedChunks = [...chunks].sort((a, b) => b.text.length - a.text.length);

        // Approximate char width in percentage.
        // Assuming container width is roughly 400px minimum for cloud area (max-w-md is 28rem = 448px)
        // A char at 48px is roughly 30px wide? So 30/448 * 100 approx 7%.
        // Let's use a scale factor.
        const charWFactor = (fontSize / 450) * 100;
        const charHFactor = (fontSize / 250) * 100;

        return sortedChunks.map(chunk => {
            const chunkW = 4 + (chunk.text.length * charWFactor);
            const chunkH = charHFactor + 2;

            let angle = 0;
            let radius = 0;
            let x, y;
            let found = false;
            const maxRadius = 100;

            while (radius < maxRadius) {
                // Spiral path
                x = centerX + radius * Math.cos(angle);
                y = centerY + radius * 0.7 * Math.sin(angle); // Ellipse

                // Keep within bounds (leaving some padding)
                const margin = 5;
                const boundedX = Math.max(margin + chunkW / 2, Math.min(100 - margin - chunkW / 2, x));
                const boundedY = Math.max(margin + chunkH / 2, Math.min(100 - margin - chunkH / 2, y));

                const candidate = {
                    left: boundedX - chunkW / 2,
                    right: boundedX + chunkW / 2,
                    top: boundedY - chunkH / 2,
                    bottom: boundedY + chunkH / 2
                };

                let collision = false;
                for (const p of positions) {
                    const buffer = 1.5; // Small buffer between pieces
                    const existing = {
                        left: p.x - p.w / 2 - buffer,
                        right: p.x + p.w / 2 + buffer,
                        top: p.y - p.h / 2 - buffer,
                        bottom: p.y + p.h / 2 + buffer
                    };
                    if (candidate.left < existing.right && candidate.right > existing.left &&
                        candidate.top < existing.bottom && candidate.bottom > existing.top) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    x = boundedX;
                    y = boundedY;
                    found = true;
                    break;
                }

                angle += 0.4;
                radius += 0.25;
            }

            if (!found) {
                x = centerX + (Math.random() - 0.5) * 60;
                y = centerY + (Math.random() - 0.5) * 60;
            }

            const pos = { x, y, w: chunkW, h: chunkH };
            positions.push(pos);
            return { ...chunk, x, y };
        });
    };

    useEffect(() => {
        const cWords = words.map(w => {
            let totalChunkIndex = 0;
            let wordChunks = [];
            const syllables = w.syllables.map((syl, sIdx) => {
                const chunks = getChunks(syl, settings.smartSelection, settings.clusters).map((txt, cIdx) => {
                    const chunkObj = { id: `${w.id}_chunk_${totalChunkIndex}`, text: txt, wordId: w.id, sylIndex: sIdx, chunkIndex: cIdx };
                    wordChunks.push(chunkObj);
                    totalChunkIndex++;
                    return chunkObj;
                });
                return { text: syl, chunks };
            });
            const positionedChunks = generateSpiralPositions(wordChunks, settings.fontSize);
            return { id: w.id, fullWord: w.word, syllables: syllables, allChunks: positionedChunks };
        });
        setCloudWords(cWords);
        setPoolChunks(cWords.flatMap(w => w.allChunks));
        setPlacedChunks({});
        setShowReward(false);
    }, [JSON.stringify(words), settings.smartSelection, settings.fontSize]);


    useEffect(() => { const totalSlots = cloudWords.reduce((acc, w) => acc + w.allChunks.length, 0); if (words.length > 0 && totalSlots > 0 && Object.keys(placedChunks).length === totalSlots) { let allCorrect = true; cloudWords.forEach(word => { word.allChunks.forEach(chunk => { const placed = placedChunks[chunk.id]; if (!placed || placed.text !== chunk.text) allCorrect = false; }); }); if (allCorrect) setTimeout(() => setShowReward(true), 200); } }, [placedChunks, words, cloudWords]);
    const handleDragStart = (e, chunk, source, slotId = null) => { setIsDragging(true); dragItemRef.current = { chunk, source, slotId }; e.dataTransfer.setData('application/json', JSON.stringify(chunk)); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { setIsDragging(false); e.target.classList.remove('dragging'); dragItemRef.current = null; document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); };
    const handleDrop = (e, targetWordId, targetChunkId) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); const dragData = dragItemRef.current; if (!dragData || dragData.chunk.wordId !== targetWordId) return; const existingChunk = placedChunks[targetChunkId]; setPlacedChunks(prev => { const next = { ...prev, [targetChunkId]: dragData.chunk }; if (dragData.source === 'slot' && dragData.slotId) delete next[dragData.slotId]; return next; }); setPoolChunks(prev => { let next = prev; if (dragData.source === 'pool') next = next.filter(c => c.id !== dragData.chunk.id); if (existingChunk) next = [...next, existingChunk]; return next; }); };
    const handleCloudReturnDrop = (e, targetWordId) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); const dragData = dragItemRef.current; if (!dragData || dragData.chunk.wordId !== targetWordId) return; if (dragData.source === 'slot') { setPlacedChunks(prev => { const next = { ...prev }; delete next[dragData.slotId]; return next; }); setPoolChunks(prev => [...prev, dragData.chunk]); } };

    // Click-to-Place Handlers
    const handleChunkClick = (chunk, source, slotId = null) => {
        if (source === 'slot') {
            // If already filled, return to pool
            setPlacedChunks(prev => { const next = { ...prev }; delete next[slotId]; return next; });
            setPoolChunks(prev => [...prev, chunk]);
            setSelectedChunk(null);
            return;
        }

        if (selectedChunk?.id === chunk.id) {
            setSelectedChunk(null);
        } else {
            setSelectedChunk(chunk);
        }
    };

    const handleSlotClick = (targetWordId, targetChunkId) => {
        if (!selectedChunk) return;
        if (selectedChunk.wordId !== targetWordId) {
            setSelectedChunk(null);
            return;
        }

        const chunkToPlace = selectedChunk;
        const existingChunk = placedChunks[targetChunkId];

        setPlacedChunks(prev => ({ ...prev, [targetChunkId]: chunkToPlace }));
        setPoolChunks(prev => {
            let next = prev.filter(c => c.id !== chunkToPlace.id);
            if (existingChunk) next = [...next, existingChunk];
            return next;
        });
        setSelectedChunk(null);
    };

    const speakWord = (text) => {
        speak(text);
    };

    const cloudSVGPath = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            {showReward && (
                <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alle Wörter richtig gebaut! Super!
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
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.Cloud className="text-blue-500" /> {title || "Schüttelwörter"}</h2>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-medium text-sm">{poolChunks.length} Teile übrig</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowVowels(!showVowels)}
                        className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                        Vokale
                    </button>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg ml-2">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="24" max="80" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-6 pb-32">
                <div className="max-w-4xl mx-auto flex flex-col gap-12">
                    {cloudWords.map((word) => {
                        const activePool = poolChunks.filter(c => c.wordId === word.id); const isCorrect = word.allChunks.every(c => placedChunks[c.id]?.text === c.text); return (
                            <div key={word.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleCloudReturnDrop(e, word.id)} className={`bg-white rounded-2xl border-2 p-6 flex flex-col items-center gap-6 shadow-sm transition-all ${isCorrect ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                                <div className="relative w-full max-w-md h-64 flex items-center justify-center">
                                    <button
                                        onClick={() => speakWord(word.fullWord)}
                                        className="absolute -left-2 top-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 ring-4 ring-white/50 z-20"
                                        title="Wort anhören"
                                    >
                                        <Icons.Volume2 size={24} />
                                    </button>
                                    <div className="absolute inset-0 text-blue-100/50 drop-shadow-sm flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                                            <path d={cloudSVGPath} fill="currentColor" stroke="#93c5fd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                        <div className="absolute inset-0 z-10 overflow-hidden rounded-full opacity-100 pointer-events-none">
                                            <div className="relative w-full h-full pointer-events-auto">
                                                {activePool.map((chunk) => (
                                                    <div key={chunk.id} draggable
                                                        onDragStart={(e) => handleDragStart(e, chunk, 'pool')}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={(e) => { e.stopPropagation(); handleChunkClick(chunk, 'pool'); }}
                                                        className={`absolute cursor-grab active:cursor-grabbing bg-white border-2 border-blue-400 shadow-lg rounded-xl flex items-stretch overflow-hidden font-bold text-slate-800 hover:scale-105 active:scale-95 transition-all touch-action-none touch-manipulation select-none touch-none ${selectedChunk?.id === chunk.id ? 'ring-4 ring-blue-500 scale-125 z-50' : 'z-20'}`}
                                                        style={{
                                                            fontFamily: settings.fontFamily,
                                                            fontSize: `${Math.max(16, settings.fontSize * 0.75)}px`,
                                                            left: `${chunk.x}%`,
                                                            top: `${chunk.y}%`,
                                                            transform: 'translate(-50%, -50%)',
                                                            whiteSpace: 'nowrap',
                                                            height: '2.5em'
                                                        }}
                                                    >
                                                        {chunk.text.split('').map((char, cI) => {
                                                            const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                            return <span key={cI} className={`flex items-center justify-center px-2 min-w-[1.1ch] h-full ${showVowels && isVowel ? "bg-yellow-200 text-yellow-900 shadow-sm" : ""}`}>{char}</span>
                                                        })}
                                                    </div>
                                                ))}
                                                {isCorrect && <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-2xl pop-animate z-30 pointer-events-none bg-green-500/10 rounded-full"><Icons.CheckCircle size={64} className="drop-shadow-lg" /></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center items-center gap-6 mt-2">
                                    {word.syllables.map((sylObj, sIdx) => (
                                        <React.Fragment key={sIdx}>
                                            {sIdx > 0 && <div className="text-slate-300 font-black text-2xl select-none">•</div>}
                                            <div className="flex gap-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                                {sylObj.chunks.map((chunk) => {
                                                    const placed = placedChunks[chunk.id];
                                                    return (
                                                        <div key={chunk.id} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target') }} onDragLeave={(e) => e.currentTarget.classList.remove('active-target')} onDrop={(e) => handleDrop(e, word.id, chunk.id)} onClick={() => handleSlotClick(word.id, chunk.id)} className={`cloud-drop-target cursor-pointer ${placed ? 'filled' : ''} px-1 flex items-center justify-center transition-all ${selectedChunk && selectedChunk.wordId === word.id ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''}`} style={{ minWidth: '3.5rem', height: `${settings.fontSize * 1.5}px` }}>
                                                            {placed ? (
                                                                <div draggable onDragStart={(e) => handleDragStart(e, placed, 'slot', chunk.id)} onDragEnd={handleDragEnd} onClick={(e) => { e.stopPropagation(); handleChunkClick(placed, 'slot', chunk.id); }} className="cursor-grab active:cursor-grabbing text-blue-900 font-bold animate-[popIn_0.3s_ease-out] touch-action-none touch-manipulation select-none touch-none flex items-stretch h-full overflow-hidden rounded-lg " style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>
                                                                    {placed.text.split('').map((char, cI) => {
                                                                        const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                                        return <span key={cI} className={`flex items-center justify-center px-1.5 min-w-[1.1ch] h-full ${showVowels && isVowel ? "bg-yellow-200 shadow-sm" : ""}`}>{char}</span>
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center gap-[2px]">
                                                                    {chunk.text.split('').map((char, charIdx) => {
                                                                        return (
                                                                            <div key={charIdx} className="flex flex-col items-center justify-end" style={{ width: `${settings.fontSize * 0.6}px`, height: '100%' }}>
                                                                                <div className="w-full h-[2px] bg-slate-300 rounded-full"></div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
