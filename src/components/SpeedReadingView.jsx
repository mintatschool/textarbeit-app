
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { Word } from './Word'; // Import Word for consistent rendering (arcs etc)
import { ProgressBar } from './ProgressBar';

export const SpeedReadingView = ({ words, settings, setSettings, onClose, title }) => {
    // Level calculation Round 4:
    // Left = Stufe 1 = Slow (Walker) = 1500ms
    // Right = Stufe 12 = Fast (RaceCar) = 30ms
    const [level, setLevel] = useState(6);

    // Logic: Stufe 1 = 1500ms. Stufe 12 = 30ms.
    // Range = 1470ms across 11 intervals (12 levels)
    const speed = Math.round(1500 - (level - 1) * (1470 / 11));

    const [gameState, setGameState] = useState('intro'); // intro, showing, hidden, feedback, results
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState([]); // { ...wordObject, success: boolean, levelAtTime: number }
    const [countdownValue, setCountdownValue] = useState(3);
    const [isFlashing, setIsFlashing] = useState(false);

    const exerciseWords = useMemo(() => {
        if (!words || words.length === 0) return [];
        return words.filter(w => w.type === 'word');
    }, [words]);

    const currentWord = exerciseWords[currentIndex];

    // Handle game transitions
    useEffect(() => {
        if (gameState === 'showing') {
            const timer = setTimeout(() => {
                setGameState('hidden');
                setTimeout(() => setGameState('feedback'), 50);
            }, speed);
            return () => clearTimeout(timer);
        }

        if (gameState === 'countdown') {
            // Initial flash
            setIsFlashing(true);
            const initialFlash = setTimeout(() => setIsFlashing(false), 400);

            const countdownTimer = setInterval(() => {
                setCountdownValue(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownTimer);
                        setGameState('showing');
                        return 3;
                    }
                    // Sync flash with each number decrement
                    setIsFlashing(true);
                    setTimeout(() => setIsFlashing(false), 400);
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(countdownTimer);
                clearTimeout(initialFlash);
            };
        }
    }, [gameState, speed]);

    const handleStart = () => {
        setResults([]);
        setCurrentIndex(0);
        setGameState('countdown');
        setCountdownValue(3);
    };

    const handleFeedback = (success) => {
        const result = {
            ...currentWord,
            success: success,
            levelAtTime: level
        };
        const newResults = [...results, result];
        setResults(newResults);

        if (currentIndex < exerciseWords.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setGameState('countdown');
            setCountdownValue(3);
        } else {
            setGameState('results');
        }
    };

    const getSliderColor = (lvl) => {
        if (lvl <= 4) return '#22c55e'; // Green
        if (lvl <= 8) return '#fbbf24'; // Amber
        return '#fb923c'; // Orange
    };

    if (exerciseWords.length === 0) {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
                <Icons.AlertTriangle className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Keine Wörter zum Anzeigen.</h2>
                <p className="text-slate-600 mb-6 font-medium">Bitte markiere zuerst einige Wörter im Text.</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">Zurück</button>
            </div>
        );
    }

    // Prepare settings for Word component to ensure syllables are shown if arcs/blocks are selected
    const viewSettings = { ...settings, displayTrigger: 'always' };

    return (
        <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <Icons.Zap className="text-purple-600 w-8 h-8" />
                    <span className="text-2xl font-black text-slate-800">{title || "Blitzlesen"}</span>
                </div>

                {gameState !== 'results' && (
                    <div className="flex flex-col items-center gap-1 min-w-[400px]">
                        <div className="flex justify-between w-full px-1 text-xs font-bold text-slate-400 uppercase tracking-wider items-center mb-1">
                            <div className="flex flex-col items-center">
                                <Icons.Snail size={24} className="text-green-500" />
                            </div>
                            <div className="flex flex-col items-center">
                                <Icons.Rabbit size={24} className="text-orange-500" />
                            </div>
                        </div>
                        <div className="w-full relative mt-2 mb-2">
                            <input
                                type="range"
                                min="1"
                                max="12"
                                step="1"
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                className="w-full h-4 rounded-lg appearance-none cursor-pointer transition-all accent-current z-10 relative speed-range"
                                style={{
                                    backgroundColor: '#e2e8f0',
                                    color: getSliderColor(level)
                                }}
                            />
                            {/* Ticks */}
                            <div className="absolute top-1/2 -translate-y-1/2 w-[calc(100%-12px)] left-[6px] flex justify-between pointer-events-none opacity-30">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="w-[1px] h-2 bg-slate-600 rounded-full" />
                                ))}
                            </div>
                        </div>

                        <div className="text-xl font-black mt-1" style={{ color: getSliderColor(level) }}>
                            Stufe {level}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* Font Size Slider - Standard App Style */}
                    {setSettings && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                            <span className="text-xs font-bold text-slate-500">A</span>
                            <input
                                type="range"
                                min="16"
                                max="120"
                                step="2"
                                value={settings.fontSize}
                                onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-xl font-bold text-slate-500">A</span>
                        </div>
                    )}

                    <button onClick={onClose} className="bg-red-500 text-white hover:bg-red-600 rounded-lg w-10 h-10 flex items-center justify-center transition-all">
                        <Icons.X size={24} />
                    </button>
                </div>
            </header>

            {gameState !== 'results' && gameState !== 'intro' && (
                <ProgressBar progress={(currentIndex / exerciseWords.length) * 100} />
            )}

            {/* Game Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative">

                {gameState === 'intro' && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mb-8">
                            <Icons.Zap className="text-purple-600 w-16 h-16 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">Bereit?</h2>
                        <p className="text-slate-500 text-xl mb-12 text-center max-w-md font-medium leading-relaxed">
                            Die Wörter blitzen kurz auf.<br />Versuche sie zu erfassen!
                        </p>
                        <button
                            onClick={handleStart}
                            className="bg-purple-600 text-white px-12 py-5 rounded-3xl font-black text-2xl hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                        >
                            <Icons.Play size={32} /> Los geht's!
                        </button>
                    </div>
                )}

                {(gameState === 'showing' || gameState === 'hidden' || gameState === 'feedback' || gameState === 'countdown') && (
                    <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl relative">

                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-[15px] tracking-widest mt-1">
                            WORT {currentIndex + 1} VON {exerciseWords.length}
                        </div>

                        {/* Word Display Area */}
                        <div className="flex-1 flex items-center justify-center w-full">
                            {gameState === 'showing' ? (
                                <div className="animate-scaleIn flex flex-wrap justify-center gap-1 leading-none" style={{ fontFamily: settings.fontFamily || 'sans-serif', fontSize: `${settings.fontSize * 1.5}px` }}>
                                    <Word
                                        {...currentWord}
                                        settings={viewSettings}
                                        isReadingMode={true}
                                        activeTool={null}
                                        highlightedIndices={new Set()}
                                        wordColors={{}}
                                        extraClassName="font-black"
                                    />
                                </div>
                            ) : (
                                <div className={`w-64 h-64 bg-slate-100/30 rounded-[4rem] flex items-center justify-center transition-opacity duration-200 ${gameState === 'countdown' && !isFlashing ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="relative flex items-center justify-center">
                                        <Icons.Zap
                                            size={gameState === 'countdown' ? 176 : 48}
                                            fill={gameState === 'countdown' ? 'currentColor' : 'none'}
                                            className={`${gameState === 'countdown' ? 'text-yellow-400' : 'text-slate-200'}`}
                                        />
                                        {gameState === 'countdown' && (
                                            <div className="absolute inset-0 flex items-center justify-center mb-2">
                                                <span className="font-black text-4xl text-black select-none">
                                                    {countdownValue}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Feedback Buttons - Absolute Screen Edge Right - Shadowless */}
                        <div className={`absolute bottom-8 right-0 flex gap-10 transition-all duration-300 ${gameState === 'feedback' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
                            <button
                                onClick={() => handleFeedback(true)}
                                className="w-24 h-24 bg-emerald-500 text-white rounded-full transition-all flex items-center justify-center hover:bg-emerald-600 hover:scale-105 active:scale-95 border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2"
                                title="Gelesen"
                            >
                                <Icons.Check size={48} strokeWidth={4} />
                            </button>
                            <button
                                onClick={() => handleFeedback(false)}
                                className="bg-red-500 text-white w-24 h-24 rounded-full transition-all flex items-center justify-center hover:bg-red-600 hover:scale-105 active:scale-95 border-b-8 border-red-700 active:border-b-0 active:translate-y-2"
                                title="Nicht erfasst"
                            >
                                <Icons.X size={48} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'results' && (
                    <div className="w-full max-w-3xl bg-white rounded-[3rem] p-10 flex flex-col md:max-h-[85vh] animate-fadeIn border border-slate-100 relative overflow-hidden">

                        <div className="flex items-center gap-5 mb-8 relative z-10">
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ergebnis</h1>
                                <p className="text-slate-500 font-bold text-lg">
                                    Du hast in der {level}. Stufe {results.filter(r => r.success).length} Wörter erkannt.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 custom-scroll mb-8 relative z-10 pl-2">
                            <div className="grid gap-3">
                                {results.map((res, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 pl-6 bg-slate-50 rounded-2xl group hover:bg-blue-50 transition-colors border border-slate-100 hover:border-blue-200">

                                        {/* Use Word Component for consistent rendering (Arcs etc) */}
                                        <div className="pointer-events-none"> {/* Disable interaction in result list */}
                                            <Word
                                                {...res}
                                                settings={viewSettings}
                                                isReadingMode={true} // Disable interactions
                                                activeTool={null}
                                                highlightedIndices={new Set()}
                                                wordColors={{}}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 ${res.success ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-rose-100 border-red-200 text-rose-500'}`}>
                                                {res.success ? <Icons.CheckCircle size={24} strokeWidth={3} /> : <Icons.X size={20} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 relative z-10 pt-4 border-t border-slate-100">
                            <button
                                onClick={handleStart}
                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Icons.RotateCcw size={24} /> Noch einmal
                            </button>
                            <button
                                onClick={onClose}
                                className="px-10 bg-white text-slate-600 border border-slate-200 py-4 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all hover:text-red-500 hover:border-red-200 shadow-sm"
                            >
                                Beenden
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.15s ease-out forwards; }
                
                input[type=range].speed-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 28px;
                    width: 28px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid currentColor;
                    cursor: pointer;
                    margin-top: -6px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    position: relative;
                    z-index: 20;
                }
                input[type=range].speed-range:active::-webkit-slider-thumb {
                    transform: scale(1.15);
                    box-shadow: 0 0 0 5px rgba(0,0,0,0.05);
                }
            `}} />
        </div>
    );
};
