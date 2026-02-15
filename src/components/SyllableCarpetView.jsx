import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';
// import availableSyllables from '../utils/available_syllables.json'; // DEACTIVATED PER USER REQUEST

const syllableSet = new Set(); // Empty set, no local audio

import { ProgressBar } from './ProgressBar';
import { RewardModal } from './shared/RewardModal';

export const SyllableCarpetView = ({ words, settings, setSettings, onClose, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [hiddenSyllables, setHiddenSyllables] = useState(new Set());
    const [shuffledSyllables, setShuffledSyllables] = useState([]);
    const [isGameMode, setIsGameMode] = useState(false);
    const [isFingerMode, setIsFingerMode] = useState(false);
    const [targetSyllable, setTargetSyllable] = useState(null);
    const [completedSyllables, setCompletedSyllables] = useState(new Set());
    const [remainingPool, setRemainingPool] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const [forceLowercase, setForceLowercase] = useState(false);

    const uniqueSyllables = useMemo(() => {
        const set = new Set();
        words.forEach(w => {
            if (w.syllables) w.syllables.forEach(s => {
                const text = typeof s === 'string' ? s : s.text;
                if (!text) return;
                set.add(forceLowercase ? text.toLowerCase().trim() : text.trim());
            });
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
    }, [JSON.stringify(words), forceLowercase]);

    useEffect(() => { setShuffledSyllables(uniqueSyllables); }, [uniqueSyllables]);
    useEffect(() => { let interval; if (timerActive) { interval = setInterval(() => setTimer(t => t + 1), 1000); } return () => clearInterval(interval); }, [timerActive]);

    const progressPercentage = useMemo(() => {
        if (!isGameMode) return 0;
        const total = completedSyllables.size + remainingPool.length;
        if (total === 0) return 100;
        return (completedSyllables.size / total) * 100;
    }, [completedSyllables.size, remainingPool.length, isGameMode]);

    const getVisibleList = () => shuffledSyllables.filter(s => !hiddenSyllables.has(s));
    const toggleGameMode = () => { if (isGameMode) { setIsGameMode(false); setTargetSyllable(null); setTimerActive(false); window.speechSynthesis.cancel(); } else { const visible = getVisibleList(); if (visible.length === 0) return; const shuffled = [...shuffledSyllables]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } setShuffledSyllables(shuffled); const pool = shuffled.filter(s => !hiddenSyllables.has(s)); if (pool.length === 0) return; setRemainingPool(pool); setCompletedSyllables(new Set()); setIsGameMode(true); setTimer(0); setTimerActive(true); setShowReward(false); setIsFingerMode(false); pickNextSyllable(pool); } };
    const pickNextSyllable = (pool) => { if (pool.length === 0) { setTimerActive(false); setTargetSyllable(null); setShowReward(true); return; } const randomIndex = Math.floor(Math.random() * pool.length); const next = pool[randomIndex]; setTargetSyllable(next); setTimeout(() => speak(next), 500); };
    const handleSyllableClick = (syl) => { if (isFingerMode) return; if (isGameMode) { if (completedSyllables.has(syl)) return; if (syl === targetSyllable) { const newCompleted = new Set(completedSyllables); newCompleted.add(syl); setCompletedSyllables(newCompleted); const newPool = remainingPool.filter(s => s !== syl); setRemainingPool(newPool); setTimeout(() => pickNextSyllable(newPool), 300); } else { speak(targetSyllable); } } else { setHiddenSyllables(prev => { const n = new Set(prev); if (n.has(syl)) n.delete(syl); else n.add(syl); return n; }); } };
    const minColWidth = Math.max(60, settings.fontSize * 2.5);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans pt-0 md:pt-0 print-content">
            <RewardModal
                isOpen={showReward}
                onClose={() => { setShowReward(false); setIsGameMode(false); }}
                message={(
                    <div className="flex flex-col items-center">
                        <span>Alle Silben gefunden!</span>
                        <p className="text-2xl text-slate-600 mt-2 font-bold">Zeit: {timer} Sekunden</p>
                    </div>
                )}
            />
            <div className="bg-white shadow-sm z-10 shrink-0">
                <div className="px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-4 md:gap-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.Grid2x2 className="text-blue-600" /> {title || "Silbenteppich"}</h2>
                        <div className="flex items-center gap-2 md:gap-4 no-print">
                            {isGameMode && (
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-mono text-lg font-bold text-blue-600">
                                    <Icons.Clock size={20} /> {timer}s
                                </div>
                            )}
                            <button
                                onClick={toggleGameMode}
                                className={`p-4 rounded-full transition-all shadow-lg flex items-center gap-2 font-black text-xl hover:scale-105 active:scale-95 ring-4 ring-white/50 ${isGameMode ? 'bg-red-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                                {isGameMode ? <><Icons.Square size={20} fill="currentColor" /> Stopp</> : <><Icons.Volume2 size={24} /> Start</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 no-print">
                        {isGameMode && (
                            <button
                                onClick={() => targetSyllable && speak(targetSyllable)}
                                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                                title="Nochmal hören"
                            >
                                <Icons.Volume2 size={32} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsFingerMode(!isFingerMode)}
                            className={`p-2.5 rounded-xl transition-all flex items-center justify-center border-2 ${isFingerMode ? 'bg-orange-500 text-white border-orange-600 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                            title="Lese-Modus (Finger)"
                        >
                            <Icons.Hand size={28} />
                        </button>

                        {/* Casing Toggle */}
                        <button
                            onClick={() => setForceLowercase(!forceLowercase)}
                            className={`w-16 h-12 flex items-center justify-center rounded-xl transition-all border mr-2 ${forceLowercase ? 'bg-blue-600 border-blue-700 shadow-inner' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white hover:shadow-sm'}`}
                            title={forceLowercase ? "Nur Kleinbuchstaben (aktiv)" : "Original Schreibung"}
                        >
                            <Icons.SyllableCasingCorrection size={38} className={forceLowercase ? 'text-white' : 'text-slate-600'} />
                        </button>

                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 h-10 rounded-lg no-print">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input type="range" min="16" max="120" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 rounded-lg cursor-pointer" />
                            <span className="text-xl font-bold text-slate-500">A</span>
                        </div>
                        <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
                    </div>
                </div>
                {isGameMode && (
                    <div className="w-full">
                        <ProgressBar progress={progressPercentage} />
                    </div>
                )}
            </div>
            <div className={`flex-1 p-6 pr-6 overflow-y-auto custom-scroll`}>
                <div className="grid gap-3 pb-32" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))` }}>
                    {shuffledSyllables.map((syl, idx) => {
                        if (hiddenSyllables.has(syl)) return null;
                        const isCompleted = completedSyllables.has(syl);
                        const hasAudio = syllableSet.has(syl.toLowerCase().trim());

                        let boxClass = (idx % 2 === 0) ? 'bg-blue-100 border-blue-200' : 'bg-blue-200 border-blue-300';
                        let textClass = 'text-slate-800';

                        // Audio availability styling: Stronger border
                        const audioClass = hasAudio && !isCompleted ? 'border-2 border-slate-400 shadow-sm' : 'border';

                        if (isCompleted) {
                            boxClass = 'bg-slate-50 border-slate-200 opacity-60';
                            textClass = 'text-gray-300';
                        } else if (isGameMode) {
                            boxClass = (idx % 2 === 0) ? 'bg-blue-50 border-blue-100' : 'bg-blue-100 border-blue-200';
                        }

                        return (
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSyllableClick(syl); } }}
                                key={idx}
                                onClick={() => handleSyllableClick(syl)}
                                className={`px-4 py-2 rounded-lg ${audioClass} ${boxClass} ${textClass} font-medium select-none text-center flex items-center justify-center transition-all duration-200 ${forceLowercase ? 'lowercase' : ''} relative ${!isFingerMode && !isGameMode ? 'cursor-pointer hover:bg-slate-200 hover:text-slate-800 hover:border-slate-300' : ''} ${isGameMode && !isCompleted && !isFingerMode ? 'cursor-pointer active:scale-95 hover:shadow-md' : ''} ${isFingerMode ? 'cursor-default' : ''}`}
                                style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, minHeight: `${settings.fontSize * 1.5}px` }}
                            >
                                {syl}
                                {isCompleted && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/80 pointer-events-none"><Icons.Check size={48} strokeWidth={4} /></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
