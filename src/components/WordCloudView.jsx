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
                return { text: syl, chunks };
            });
            // We just shuffle the chunks to prevent direct order hints
            const shuffledChunks = [...wordChunks].sort(() => Math.random() - 0.5);
            return { id: w.id, fullWord: w.word, syllables: syllables, allChunks: shuffledChunks };
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
                            <div key={word.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleCloudReturnDrop(e, word.id)} className={`bg-white rounded-2xl border-2 p-6 flex flex-col items-center gap-6 shadow-sm transition-all ${isCorrect ? 'border-slate-200' : 'border-slate-200'}`}>
                                <div className="relative w-full max-w-md h-64 flex items-center justify-center">
                                    <div className="absolute inset-0 text-blue-100/50 drop-shadow-sm flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                                            <path d={cloudSVGPath} fill="currentColor" stroke="#93c5fd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                        <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl opacity-100 pointer-events-none">
                                            <div className="relative w-full h-full pointer-events-auto flex flex-wrap justify-center items-center content-center gap-3 p-8">
                                                {activePool.map((chunk, idx) => {
                                                    // Pseudo-random rotation based on index to be stable but playful
                                                    const rotate = (idx % 2 === 0 ? 1 : -1) * ((idx * 3) % 4 + 1);
                                                    return (
                                                        <div key={chunk.id} draggable
                                                            onDragStart={(e) => handleDragStart(e, chunk, 'pool')}
                                                            onDragEnd={handleDragEnd}
                                                            onClick={(e) => { e.stopPropagation(); handleChunkClick(chunk, 'pool'); }}
                                                            onContextMenu={(e) => e.preventDefault()}
                                                            className={`cursor-grab active:cursor-grabbing bg-white border-2 border-blue-400 shadow-md rounded-lg flex items-center justify-center font-bold text-slate-800 hover:scale-110 active:scale-95 transition-all touch-action-none touch-manipulation select-none touch-none ${selectedChunk?.id === chunk.id ? 'ring-4 ring-blue-500 scale-125 z-50' : 'z-20'}`}
                                                            style={{
                                                                fontFamily: settings.fontFamily,
                                                                fontSize: `${Math.max(16, settings.fontSize * 0.75)}px`,
                                                                transform: `rotate(${rotate}deg)`,
                                                                padding: '0.3em 0.6em',
                                                                margin: '2px'
                                                            }}
                                                        >
                                                            {chunk.text.split('').map((char, cI) => {
                                                                const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                                return <span key={cI} className={`flex items-center justify-center ${showVowels && isVowel ? "bg-yellow-200 text-yellow-900 rounded px-1" : ""}`}>{char}</span>
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                                {isCorrect && <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-2xl pop-animate z-30 pointer-events-none rounded-full"><Icons.CheckCircle size={settings.fontSize * 1.5} className="drop-shadow-lg" /></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center items-center gap-6 mt-2 relative">
                                    <div className="flex flex-wrap justify-center items-center gap-1">
                                        {word.syllables.map((sylObj, sIdx) => {
                                            const isEven = sIdx % 2 === 0;
                                            return (
                                                <div key={sIdx} className={`flex gap-1 p-2 rounded-xl border transition-colors ${isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50'}`}>
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
                                                                                    <div className="w-full h-[2px] bg-slate-400 rounded-full"></div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => speakWord(word.fullWord)}
                                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ring-4 ring-white/50 hover:scale-105 active:scale-95"
                                        title="Wort anhören"
                                    >
                                        <Icons.Volume2 size={24} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
