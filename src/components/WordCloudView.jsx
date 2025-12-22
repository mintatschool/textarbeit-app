import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { getChunks } from '../utils/syllables';

export const WordCloudView = ({ words, settings, setSettings, onClose }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [cloudWords, setCloudWords] = useState([]);
    const [placedChunks, setPlacedChunks] = useState({});
    const [poolChunks, setPoolChunks] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [showVowels, setShowVowels] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragItemRef = useRef(null);

    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => { document.body.style.overflow = ''; document.removeEventListener('touchmove', preventDefault); };
    }, [isDragging]);

    const generateSpiralPositions = (chunks) => { const positions = []; const centerX = 50; const centerY = 50; const sortedChunks = [...chunks].sort((a, b) => b.text.length - a.text.length); return sortedChunks.map(chunk => { const charW = 3; const chunkW = 7 + (chunk.text.length * charW); const chunkH = 12; let angle = 0; let radius = 0; let x, y; let found = false; const maxRadius = 100; while (radius < maxRadius) { x = centerX + radius * Math.cos(angle); y = centerY + radius * 0.6 * Math.sin(angle); const candidate = { left: x - chunkW / 2, right: x + chunkW / 2, top: y - chunkH / 2, bottom: y + chunkH / 2 }; let collision = false; for (const p of positions) { const existing = { left: p.x - p.w / 2 - 2, right: p.x + p.w / 2 + 2, top: p.y - p.h / 2 - 2, bottom: p.y + p.h / 2 + 2 }; if (candidate.left < existing.right && candidate.right > existing.left && candidate.top < existing.bottom && candidate.bottom > existing.top) { collision = true; break; } } if (!collision) { found = true; break; } angle += 0.5; radius += 0.2; } if (!found) { x = centerX + (Math.random() - 0.5) * 80; y = centerY + (Math.random() - 0.5) * 80; } const pos = { x, y, w: chunkW, h: chunkH }; positions.push(pos); return { ...chunk, x, y }; }); };

    useEffect(() => {
        const cWords = words.map(w => {
            let totalChunkIndex = 0;
            let wordChunks = [];
            const syllables = w.syllables.map((syl, sIdx) => {
                const chunks = getChunks(syl, settings.smartSelection).map((txt, cIdx) => {
                    const chunkObj = { id: `${w.id}_chunk_${totalChunkIndex}`, text: txt, wordId: w.id, sylIndex: sIdx, chunkIndex: cIdx };
                    wordChunks.push(chunkObj);
                    totalChunkIndex++;
                    return chunkObj;
                });
                return { text: syl, chunks };
            });
            const positionedChunks = generateSpiralPositions(wordChunks);
            return { id: w.id, fullWord: w.word, syllables: syllables, allChunks: positionedChunks };
        });
        setCloudWords(cWords);
        setPoolChunks(cWords.flatMap(w => w.allChunks));
        setPlacedChunks({});
        setShowReward(false);
    }, [JSON.stringify(words), settings.smartSelection]);

    useEffect(() => { const totalSlots = cloudWords.reduce((acc, w) => acc + w.allChunks.length, 0); if (words.length > 0 && totalSlots > 0 && Object.keys(placedChunks).length === totalSlots) { let allCorrect = true; cloudWords.forEach(word => { word.allChunks.forEach(chunk => { const placed = placedChunks[chunk.id]; if (!placed || placed.text !== chunk.text) allCorrect = false; }); }); if (allCorrect) setTimeout(() => setShowReward(true), 200); } }, [placedChunks, words, cloudWords]);
    const handleDragStart = (e, chunk, source, slotId = null) => { setIsDragging(true); dragItemRef.current = { chunk, source, slotId }; e.dataTransfer.setData('application/json', JSON.stringify(chunk)); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { setIsDragging(false); e.target.classList.remove('dragging'); dragItemRef.current = null; document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); };
    const handleDrop = (e, targetWordId, targetChunkId) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); const dragData = dragItemRef.current; if (!dragData || dragData.chunk.wordId !== targetWordId) return; const existingChunk = placedChunks[targetChunkId]; setPlacedChunks(prev => { const next = { ...prev, [targetChunkId]: dragData.chunk }; if (dragData.source === 'slot' && dragData.slotId) delete next[dragData.slotId]; return next; }); setPoolChunks(prev => { let next = prev; if (dragData.source === 'pool') next = next.filter(c => c.id !== dragData.chunk.id); if (existingChunk) next = [...next, existingChunk]; return next; }); };
    const handleCloudReturnDrop = (e, targetWordId) => { setIsDragging(false); e.preventDefault(); e.stopPropagation(); const dragData = dragItemRef.current; if (!dragData || dragData.chunk.wordId !== targetWordId) return; if (dragData.source === 'slot') { setPlacedChunks(prev => { const next = { ...prev }; delete next[dragData.slotId]; return next; }); setPoolChunks(prev => [...prev, dragData.chunk]); } };

    const speakWord = (text) => {
        if (!('speechSynthesis' in window)) return;
        const speak = (voices) => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'de-DE';
            u.voice = voices.find(v => v.lang.includes('de') && (v.name.includes('Google') || v.name.includes('Female'))) || voices.find(v => v.lang.includes('de')) || null;
            window.speechSynthesis.speak(u);
        };
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) speak(voices);
        else window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); speak(voices); };
    };

    const cloudSVGPath = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            {showReward && (<div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `-10%`, backgroundColor: ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)], animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random()}s` }}></div>)}<div className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-2xl pop-animate pointer-events-auto text-center border-4 border-yellow-400"><h2 className="text-4xl font-bold text-slate-800 mb-4">Super gemacht! 🎉</h2><button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition min-touch-target">Zurück</button></div></div>)}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.Cloud className="text-blue-500" /> Schüttelwörter</h2>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-medium text-sm">{poolChunks.length} Teile übrig</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="24" max="80" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                </div>
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target"><Icons.X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll p-6 pb-32">
                <div className="max-w-4xl mx-auto flex flex-col gap-12">
                    {cloudWords.map((word) => {
                        const activePool = poolChunks.filter(c => c.wordId === word.id); const isCorrect = word.allChunks.every(c => placedChunks[c.id]?.text === c.text); return (
                            <div key={word.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleCloudReturnDrop(e, word.id)} className={`bg-white rounded-2xl border-2 p-6 flex flex-col items-center gap-6 shadow-sm transition-all ${isCorrect ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                                <div className="relative w-full max-w-md h-64 flex items-center justify-center">
                                    <button onClick={() => speakWord(word.fullWord)} className="absolute -left-2 top-0 p-3 text-slate-400 hover:text-blue-600 bg-white rounded-full shadow-sm border hover:bg-blue-50 transition z-20 min-touch-target"><Icons.Volume2 size={24} /></button>
                                    <div className="absolute inset-0 text-blue-100 drop-shadow-sm flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none"><path d={cloudSVGPath} fill="currentColor" stroke="#93c5fd" strokeWidth="0.5" vectorEffect="non-scaling-stroke" /></svg><div className="absolute inset-0 z-10 overflow-hidden rounded-full opacity-100 pointer-events-none"><div className="relative w-full h-full pointer-events-auto">{activePool.map((chunk) => (<div key={chunk.id} draggable onDragStart={(e) => handleDragStart(e, chunk, 'pool')} onDragEnd={handleDragEnd} className="absolute cursor-grab active:cursor-grabbing bg-white border border-blue-200 shadow-sm rounded px-2 py-0.5 font-bold text-slate-700 hover:scale-110 transition-transform touch-action-none touch-manipulation select-none touch-none" style={{ fontFamily: settings.fontFamily, fontSize: `${Math.max(16, settings.fontSize * 0.8)}px`, left: `${chunk.x}%`, top: `${chunk.y}%`, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
                                        {chunk.text.split('').map((char, cI) => {
                                            const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                            return <span key={cI} className={`inline-block rounded-sm ${showVowels && isVowel ? "bg-yellow-200 shadow-sm" : ""}`}>{char}</span>
                                        })}
                                    </div>))}{isCorrect && <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-2xl pop-animate z-30 pointer-events-none"><Icons.Check size={48} /></div>}</div></div></div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                    {word.syllables.map((sylObj, sIdx) => (
                                        <div key={sIdx} className="flex gap-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                            {sylObj.chunks.map((chunk) => {
                                                const placed = placedChunks[chunk.id];
                                                return (
                                                    <div key={chunk.id} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target') }} onDragLeave={(e) => e.currentTarget.classList.remove('active-target')} onDrop={(e) => handleDrop(e, word.id, chunk.id)} className={`cloud-drop-target ${placed ? 'filled' : ''} px-1 flex items-center justify-center transition-all`} style={{ minWidth: '3.5rem', height: `${settings.fontSize * 1.5}px` }}>
                                                        {placed ? (
                                                            <div draggable onDragStart={(e) => handleDragStart(e, placed, 'slot', chunk.id)} onDragEnd={handleDragEnd} className="cursor-grab active:cursor-grabbing text-blue-900 font-bold animate-[popIn_0.3s_ease-out] touch-action-none touch-manipulation select-none touch-none" style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>
                                                                {placed.text.split('').map((char, cI) => {
                                                                    const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                                    return <span key={cI} className={`inline-block rounded-sm ${showVowels && isVowel ? "bg-yellow-200 shadow-sm" : ""}`}>{char}</span>
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
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="absolute bottom-6 left-6 z-50">
                <button onClick={() => setShowVowels(!showVowels)} className={`px-4 py-3 rounded-xl font-bold text-lg border shadow-lg transition-transform hover:scale-105 min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 'bg-white text-slate-500 border-slate-200'}`}>Vokale</button>
            </div>
        </div>
    );
};
