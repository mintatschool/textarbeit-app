import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { getChunks } from '../utils/syllables';
import { speak } from '../utils/speech';
import { ProgressBar } from './ProgressBar';
import { ExerciseHeader } from './ExerciseHeader';
import { shuffleArray } from '../utils/arrayUtils';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';
polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });
export const WordCloudView = ({ words, settings, setSettings, onClose, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} IconComponent={Icons.GhostHighlight} /></div>);

    // Stage State
    const [stages, setStages] = useState([]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [stageWords, setStageWords] = useState([]);

    // Game State
    const [placedChunks, setPlacedChunks] = useState({});
    const [poolChunks, setPoolChunks] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [showVowels, setShowVowels] = useState(false);

    // Drag/UI State
    const [isDragging, setIsDragging] = useState(false);
    const [selectedChunk, setSelectedChunk] = useState(null);
    const dragItemRef = useRef(null);

    useEffect(() => {
        if (!isDragging) return;
        const preventDefault = (e) => { e.preventDefault(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });
        return () => { document.body.style.overflow = ''; document.removeEventListener('touchmove', preventDefault); };
    }, [isDragging]);

    // Initialization & Grouping
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
            // Shuffle chunks for the cloud
            const shuffledChunks = [...wordChunks].sort(() => Math.random() - 0.5);
            return { id: w.id, fullWord: w.word, syllables: syllables, allChunks: shuffledChunks };
        });

        const shuffledWords = shuffleArray(cWords);

        // Group into pairs
        const newStages = [];
        for (let i = 0; i < shuffledWords.length; i += 2) {
            newStages.push(shuffledWords.slice(i, i + 2));
        }
        setStages(newStages);
        setCurrentStageIndex(0);
        setPlacedChunks({});
        setShowReward(false);
    }, [JSON.stringify(words), settings.smartSelection, settings.fontSize]);

    // Update Stage Words & Pool
    useEffect(() => {
        if (stages.length === 0) return;
        const currentBatch = stages[currentStageIndex];
        setStageWords(currentBatch);

        // Only set pool chunks for the current stage words that haven't been placed yet
        // Since we persist placedChunks generally, we need to carefully filter
        const currentWordIds = currentBatch.map(w => w.id);
        const relevantChunks = currentBatch.flatMap(w => w.allChunks);

        // Filter out chunks that are already placed
        const remainingChunks = relevantChunks.filter(c => !placedChunks[c.id]);
        setPoolChunks(remainingChunks);

    }, [stages, currentStageIndex, placedChunks]);

    // Check Global Completion (only for "Reward" logic at the very end)
    useEffect(() => {
        // Logic moved to "Weiter" / "Beenden" button
    }, []);

    const handleDragStart = (e, chunk, source, slotId = null) => { setIsDragging(true); dragItemRef.current = { chunk, source, slotId }; e.dataTransfer.setData('application/json', JSON.stringify(chunk)); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { setIsDragging(false); e.target.classList.remove('dragging'); dragItemRef.current = null; document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target')); };
    const handleDrop = (e, targetWordId, targetChunkId) => {
        setIsDragging(false);
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target'));
        const dragData = dragItemRef.current;
        if (!dragData || dragData.chunk.wordId !== targetWordId) return;

        const existingChunk = placedChunks[targetChunkId];

        setPlacedChunks(prev => {
            const next = { ...prev, [targetChunkId]: dragData.chunk };
            if (dragData.source === 'slot' && dragData.slotId) delete next[dragData.slotId];
            return next;
        });

        // Pool update is handled by useEffect dependency on placedChunks
    };

    const handleCloudReturnDrop = (e, targetWordId) => {
        setIsDragging(false);
        e.preventDefault();
        e.stopPropagation();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.chunk.wordId !== targetWordId) return;
        if (dragData.source === 'slot') {
            setPlacedChunks(prev => {
                const next = { ...prev };
                delete next[dragData.slotId];
                return next;
            });
        }
    };

    // Calculate Progress (Global)
    const progressPercentage = React.useMemo(() => {
        if (stages.length === 0) return 0;
        const totalChunksAll = stages.flat().reduce((acc, w) => acc + w.allChunks.length, 0);
        if (totalChunksAll === 0) return 0;
        const placedCount = Object.keys(placedChunks).length;
        // This is a rough estimate since placedChunks might contain wrong placements, but good enough for progress bar
        return (placedCount / totalChunksAll) * 100;
    }, [stages, placedChunks]);

    // Click-to-Place Handlers
    const handleChunkClick = (chunk, source, slotId = null) => {
        if (source === 'slot') {
            setPlacedChunks(prev => { const next = { ...prev }; delete next[slotId]; return next; });
            setSelectedChunk(null);
            return;
        }
        if (selectedChunk?.id === chunk.id) setSelectedChunk(null);
        else setSelectedChunk(chunk);
    };

    const handleSlotClick = (targetWordId, targetChunkId) => {
        if (!selectedChunk) return;
        if (selectedChunk.wordId !== targetWordId) { setSelectedChunk(null); return; }
        setPlacedChunks(prev => ({ ...prev, [targetChunkId]: selectedChunk }));
        setSelectedChunk(null);
    };

    const speakWord = (text) => { speak(text); };

    // Stage Navigation
    const isStageComplete = stageWords.every(w => {
        // A word is complete if every chunk slot is filled with the CORRECT chunk text
        return w.allChunks.every(c => placedChunks[c.id]?.text === c.text);
    });

    const handleNextStage = () => {
        if (currentStageIndex < stages.length - 1) {
            setCurrentStageIndex(prev => prev + 1);
        } else {
            setShowReward(true);
        }
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
                                <Icons.Check size={64} className="text-green-500" /> Alle Wörter richtig gebaut! Super!
                            </span>
                            <button onClick={onClose} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg min-touch-target">
                                Beenden
                            </button>
                        </div>
                    </div>
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

            <ExerciseHeader
                title="Schüttelwörter"
                icon={Icons.Cloud}
                current={currentStageIndex + 1}
                total={stages.length}
                progressPercentage={progressPercentage}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={24}
                sliderMax={80}
                customControls={
                    <button
                        onClick={() => setShowVowels(!showVowels)}
                        className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                        Vokale
                    </button>
                }
            />

            <div className="flex-1 overflow-y-auto custom-scroll p-6 pb-32">
                <div className="w-full flex flex-row flex-wrap items-start justify-center gap-8 max-w-full">
                    {stageWords.map((word) => {
                        const activePool = poolChunks.filter(c => c.wordId === word.id);

                        // Check status for this specific word
                        const totalChunks = word.allChunks.length;
                        const placedForWord = word.allChunks.filter(c => placedChunks[c.id]).length;
                        const correctForWord = word.allChunks.every(c => placedChunks[c.id]?.text === c.text);

                        // Error condition: All chunks placed but not correct
                        const hasError = placedForWord === totalChunks && !correctForWord;

                        // Border logic
                        let borderClass = 'border-slate-200'; // default thin
                        if (correctForWord) {
                            borderClass = 'border-green-500 bg-green-50/30';
                        } else if (hasError) {
                            borderClass = 'border-red-400 bg-red-50/10';
                        }

                        return (
                            <div key={word.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleCloudReturnDrop(e, word.id)}
                                className={`rounded-xl border-2 p-4 flex flex-col items-start gap-4 shadow-sm transition-all w-fit max-w-full bg-white ${borderClass}`}
                            >
                                <div className="relative w-full min-w-[12rem] max-w-full min-h-[12rem] flex items-center justify-center">
                                    <div className="absolute inset-0 text-blue-100/50 drop-shadow-sm flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                                            <path d={cloudSVGPath} fill="currentColor" stroke="#93c5fd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                    </div>

                                    <div className="relative z-10 w-full h-full flex flex-wrap justify-center items-center content-center gap-3 p-6">
                                        {activePool.map((chunk, idx) => {
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
                                                        padding: '0.2em 0.5em',
                                                        margin: '2px',
                                                        width: 'min-content'
                                                    }}
                                                >
                                                    {chunk.text.split('').map((char, cI) => {
                                                        const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                        return <span key={cI} className={`flex items-center justify-center ${showVowels && isVowel ? "bg-yellow-200 text-yellow-900 rounded px-0.5" : ""}`}>{char}</span>
                                                    })}
                                                </div>
                                            );
                                        })}
                                        {correctForWord && <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-2xl pop-animate z-30 pointer-events-none rounded-full"><Icons.Check size={settings.fontSize * 1.5} strokeWidth={3} className="drop-shadow-lg" /></div>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-start items-center gap-6 mt-1 ml-4 relative w-full">
                                    <div className="flex flex-wrap justify-start items-center gap-1">
                                        {word.syllables.map((sylObj, sIdx) => {
                                            const isEven = sIdx % 2 === 0;

                                            // 1. Determine Container Styles based on settings.visualType
                                            let containerClasses = "flex gap-1 p-2 rounded-xl border transition-colors relative ";
                                            let arcColor = isEven ? '#2563eb' : '#dc2626';

                                            if (settings.visualType === 'block') {
                                                containerClasses += isEven ? 'bg-blue-100 border-blue-200/50' : 'bg-blue-200 border-blue-300/50';
                                            } else if (settings.visualType === 'arc') {
                                                containerClasses += 'bg-transparent border-transparent pb-4'; // Extra padding for arc
                                            } else if (settings.visualType === 'black_gray') {
                                                containerClasses += 'bg-transparent border-transparent';
                                            } else {
                                                // Default fallback (e.g. if 'none') - maybe just transparent? 
                                                // Or if user wants 'off', we still need structure.
                                                // Default to 'block' if unsure? Or minimalistic?
                                                // Let's stick to transparent for 'none' or others
                                                containerClasses += 'bg-transparent border-transparent';
                                            }

                                            // 2. Determine Text Color for "Content" (Dropped items)
                                            let contentTextColor = 'text-blue-900';
                                            if (settings.visualType === 'black_gray') {
                                                contentTextColor = isEven ? 'text-black' : 'text-gray-400';
                                            }

                                            return (
                                                <div key={sIdx} className={containerClasses}>
                                                    {sylObj.chunks.map((chunk) => {
                                                        const placed = placedChunks[chunk.id];
                                                        return (
                                                            <div key={chunk.id} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => { e.preventDefault(); e.currentTarget.classList.add('active-target') }} onDragLeave={(e) => e.currentTarget.classList.remove('active-target')} onDrop={(e) => handleDrop(e, word.id, chunk.id)} onClick={() => handleSlotClick(word.id, chunk.id)} className={`cloud-drop-target cursor-pointer ${placed ? 'filled' : ''} px-1 flex items-center justify-center transition-all ${selectedChunk && selectedChunk.wordId === word.id ? 'ring-2 ring-blue-300 ring-offset-2 animate-pulse' : ''}`} style={{ minWidth: `${Math.max(2.5, settings.fontSize * 0.08)}rem`, height: `${settings.fontSize * 1.5}px` }}>
                                                                {placed ? (
                                                                    <div draggable onDragStart={(e) => handleDragStart(e, placed, 'slot', chunk.id)} onDragEnd={handleDragEnd} onClick={(e) => { e.stopPropagation(); handleChunkClick(placed, 'slot', chunk.id); }} className={`cursor-grab active:cursor-grabbing font-bold animate-[popIn_0.3s_ease-out] touch-action-none touch-manipulation select-none touch-none flex items-stretch h-full overflow-hidden rounded-lg ${contentTextColor}`} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>
                                                                        {placed.text.split('').map((char, cI) => {
                                                                            const isVowel = /[aeiouyäöüAEIOUYÄÖÜ]/.test(char);
                                                                            // Ensure background for vowels doesn't conflict with text color mode? 
                                                                            // User usually wants vowels highlighted if toggled.
                                                                            return <span key={cI} className={`flex items-center justify-center px-1.5 min-w-[1.1ch] h-full ${showVowels && isVowel ? "bg-yellow-200 shadow-sm text-yellow-900" : ""}`}>{char}</span>
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
                                                    {/* Render Arc if needed */}
                                                    {settings.visualType === 'arc' && (
                                                        <svg className="absolute bottom-0 left-0 w-full h-4 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
                                                            <path d="M 2 2 Q 50 20 98 2" fill="none" stroke={arcColor} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                                        </svg>
                                                    )}
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
                {isStageComplete && (
                    <div className="flex justify-end mt-8 mr-8">
                        <button
                            onClick={handleNextStage}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {currentStageIndex < stages.length - 1 ? "Weiter" : "Abschließen"} <Icons.ArrowRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
