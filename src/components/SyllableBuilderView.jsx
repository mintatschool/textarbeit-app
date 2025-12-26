import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { speak } from '../utils/speech';
import availableSyllables from '../utils/available_syllables.json';
import { getChunks } from '../utils/syllables';

const syllableSet = new Set(availableSyllables);

export const SyllableBuilderView = ({ settings, onClose }) => {
    // 1. Filter syllables that consist of exactly 2 parts (Letter/Cluster)
    const candidates = useMemo(() => {
        return availableSyllables.filter(syl => {
            const chunks = getChunks(syl, true);
            return chunks.length === 2;
        });
    }, []);

    const [currentSyllable, setCurrentSyllable] = useState(null);
    const [parts, setParts] = useState([]); // [part1, part2]
    const [slots, setSlots] = useState([null, null]); // [filledPart1, filledPart2]
    const [options, setOptions] = useState([]); // shuffled parts including distractors
    const [isComplete, setIsComplete] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [distractors, setDistractors] = useState([]);

    // Initialize game
    useEffect(() => {
        nextRound();
    }, []);

    const nextRound = () => {
        if (candidates.length === 0) return;
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        const p = getChunks(next, true);

        setCurrentSyllable(next);
        setParts(p);
        setSlots([null, null]);
        setIsComplete(false);
        setShowReward(false);

        // Generate distractors
        // Ideally distractors should be similar. For simplicity, pick random parts from other syllables.
        const otherParts = candidates
            .filter(c => c !== next)
            .map(c => getChunks(c, true))
            .flat();

        // Pick 2-3 distractors
        const pickedDistractors = [];
        for (let i = 0; i < 3; i++) {
            pickedDistractors.push(otherParts[Math.floor(Math.random() * otherParts.length)]);
        }
        setDistractors(pickedDistractors);

        // Combine and shuffle options
        const allOptions = [...p, ...pickedDistractors].map((val, idx) => ({ id: `opt-${idx}`, val, status: 'available' }));

        // Shuffle
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }
        setOptions(allOptions);

        // Auto-play audio
        setTimeout(() => speak(next), 500);
    };

    const handleOptionClick = (option) => {
        if (option.status !== 'available' || isComplete) return;

        // Find first empty slot
        const emptySlotIndex = slots.findIndex(s => s === null);
        if (emptySlotIndex === -1) return; // Full

        const newSlots = [...slots];
        newSlots[emptySlotIndex] = option;
        setSlots(newSlots);

        // Mark option as used
        setOptions(prev => prev.map(o => o.id === option.id ? { ...o, status: 'used' } : o));

        // Check completion logic
        // If both slots are filled, check if correct
        if (emptySlotIndex === 1) { // We just filled the last slot (index 1)
            const checkSlots = [...newSlots];
            checkSlots[1] = option; // Ensure we have the latest state just in case

            const builtSyllable = checkSlots.map(s => s.val).join('');
            if (builtSyllable === currentSyllable) {
                setIsComplete(true);
                setShowReward(true);
                speak(currentSyllable);
                setTimeout(nextRound, 2000);
            } else {
                // Wrong: Reset after short delay
                setTimeout(() => {
                    setSlots([null, null]);
                    setOptions(prev => prev.map(o => ({ ...o, status: 'available' })));
                    speak('Falsch'); // Or a sound effect? Let's just create a visual shake or similar?
                    // Currently just speak "Start" logic re-trigger?
                }, 1000);
            }
        }
    };

    const handleSlotClick = (index) => {
        if (!slots[index] || isComplete) return;
        const option = slots[index];

        const newSlots = [...slots];
        newSlots[index] = null;
        setSlots(newSlots);

        setOptions(prev => prev.map(o => o.id === option.id ? { ...o, status: 'available' } : o));
    };

    if (candidates.length === 0) return <div className="p-8">Keine passenden Silben gefunden.</div>;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between z-10 shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Icons.Blocks className="text-indigo-600" /> Silben-Baukasten
                </h2>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => currentSyllable && speak(currentSyllable)}
                        className="p-3 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition shadow-sm font-bold flex items-center gap-2 min-touch-target"
                    >
                        <Icons.Volume2 size={24} /> Anhören
                    </button>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12 p-6 relative overflow-hidden">
                {showReward && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="confetti" style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`,
                                backgroundColor: ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)],
                                animationDuration: `${2 + Math.random() * 3}s`,
                                animationDelay: `${Math.random()}s`
                            }} />
                        ))}
                        <div className="text-9xl pop-animate drop-shadow-2xl">🎉</div>
                    </div>
                )}

                {/* Slots */}
                <div className="flex gap-4">
                    {slots.map((slot, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSlotClick(idx)}
                            className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed flex items-center justify-center text-5xl font-bold cursor-pointer transition-all ${slot
                                    ? 'bg-white border-blue-500 text-slate-800 shadow-md scale-100'
                                    : 'bg-slate-50 border-slate-300 text-slate-300 scale-95 hover:bg-white hover:border-blue-300'
                                } ${isComplete ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
                        >
                            {slot ? slot.val : idx + 1}
                        </div>
                    ))}
                </div>

                {/* Arrow / Plus */}
                <div className="text-slate-300">
                    <Icons.Plus size={48} />
                </div>

                {/* Options */}
                <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            disabled={opt.status === 'used'}
                            onClick={() => handleOptionClick(opt)}
                            className={`px-6 py-4 rounded-xl text-3xl font-bold shadow-sm transition-all min-touch-target ${opt.status === 'used'
                                    ? 'bg-slate-100 text-slate-300 opacity-50 scale-90'
                                    : 'bg-white border-b-4 border-blue-200 text-blue-600 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md'
                                }`}
                        >
                            {opt.val}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
