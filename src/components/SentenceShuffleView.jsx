import React, { useState, useEffect, useRef } from 'react';
import { Word } from './Word';
import { Icons } from './Icons';
import { shuffleArray } from '../utils/arrayUtils';
import { ProgressBar } from './ProgressBar';
import { EmptyStateMessage } from './EmptyStateMessage';

import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';
polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride });
// Pastel colors for words
const WORD_COLORS = [
    'bg-red-100',
    'bg-orange-100',
    'bg-amber-100',
    'bg-yellow-100',
    'bg-lime-100',
    'bg-green-100',
    'bg-emerald-100',
    'bg-teal-100',
    'bg-cyan-100',
    'bg-sky-100',
    'bg-blue-100',
    'bg-indigo-100',
    'bg-violet-100',
    'bg-purple-100',
    'bg-fuchsia-100',
    'bg-pink-100',
    'bg-rose-100'
];

// Split text into sentences
const splitIntoSentences = (text) => {
    return text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
};

// Split sentence into words
const splitIntoWords = (sentence) => {
    return sentence.split(/\s+/).filter(w => w.length > 0);
};

// Fisher-Yates shuffle
// Fisher-Yates shuffle moved to utils

export const SentenceShuffleView = ({ text, settings, setSettings, onClose, title, hyphenator }) => {
    if (!text || text.trim().length === 0) {
        return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    }

    const [sentences, setSentences] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [words, setWords] = useState([]);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [completedSentences, setCompletedSentences] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

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

    // Initialize sentences
    useEffect(() => {
        const allSentences = splitIntoSentences(text);
        if (allSentences.length < 1) {
            alert("Der Text enthält keine vollständigen Sätze.");
            onClose();
            return;
        }
        setSentences(shuffleArray(allSentences));
        setCurrentIndex(0);
        setCompletedSentences(new Set());
        setShowReward(false);
    }, [text]);

    // Initialize words for current sentence
    useEffect(() => {
        if (sentences.length === 0 || currentIndex >= sentences.length) return;

        const sentence = sentences[currentIndex];
        const wordList = splitIntoWords(sentence);
        const wordObjects = wordList.map((word, idx) => {
            let displayText = word;
            if (idx === 0 && word.length > 0) {
                displayText = word.charAt(0).toUpperCase() + word.slice(1);
            }
            return {
                id: `word-${idx}`,
                text: displayText,
                originalIndex: idx,
                color: WORD_COLORS[idx % WORD_COLORS.length]
            };
        });

        // Shuffle words
        const shuffled = shuffleArray(wordObjects);
        setWords(shuffled);
        setIsCorrect(false);
    }, [sentences, currentIndex]);

    // Check if current order is correct
    const checkOrder = () => {
        const correct = words.every((w, i) => w.originalIndex === i);
        if (correct) {
            setIsCorrect(true);
            setCompletedSentences(prev => new Set([...prev, currentIndex]));
        } else {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);

            // Shake animation
            const container = document.getElementById('word-container');
            if (container) {
                container.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(5px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 400 });
            }
        }
    };

    // Go to next sentence
    const nextSentence = () => {
        if (currentIndex < sentences.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowReward(true);
        }
    };

    // Drag handlers
    const handleDragStart = (e, position) => {
        setIsDragging(true);
        dragItem.current = position;

        // Safari/iPad Fix: setData is mandatory to trigger drag
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.target.classList.add('opacity-50', 'scale-105'), 0);
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
        e.preventDefault();
        e.currentTarget.classList.add('scale-110', 'shadow-lg');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('scale-110', 'shadow-lg');
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        e.target.classList.remove('opacity-50', 'scale-105');
        document.querySelectorAll('.word-card').forEach(el => {
            el.classList.remove('scale-110', 'shadow-lg');
        });

        const dI = dragItem.current;
        const dO = dragOverItem.current;

        if (dI !== null && dO !== null && dI !== dO) {
            const newWords = [...words];
            const draggedItem = newWords[dI];
            newWords.splice(dI, 1);
            newWords.splice(dO, 0, draggedItem);
            setWords(newWords);
            setIsCorrect(false);
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const progress = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            {/* Reward Modal */}
            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alles richtig sortiert! Super!"
            />

            <ExerciseHeader
                title={title || "Schüttelsätze"}
                icon={Icons.Shuffle}
                current={currentIndex + 1}
                total={sentences.length}
                progressPercentage={progress}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={20}
                sliderMax={128}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scroll">


                {/* Word Cards Container */}
                <div
                    id="word-container"
                    className={`flex flex-wrap justify-center items-center max-w-[95vw] p-4 rounded-2xl transition-all duration-300 ${isCorrect ? 'bg-green-50' : 'bg-white'
                        }`}
                    style={{ columnGap: `${(settings.wordSpacing ?? 0.5)}em`, rowGap: '1em' }}
                >
                    {words.map((word, idx) => (
                        <div
                            key={word.id}
                            draggable={!isCorrect}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragEnter={(e) => handleDragEnter(e, idx)}
                            onDragLeave={handleDragLeave}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`word-card px-4 py-2 rounded-xl shadow-sm select-none transition-all duration-200 ${word.color} ${isCorrect
                                ? 'cursor-default'
                                : 'cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-md'
                                }`}
                            style={{
                                fontFamily: settings.fontFamily,
                                fontSize: `${settings.fontSize}px`
                            }}
                        >
                            <Word
                                word={word.text}
                                startIndex={0}
                                settings={settings}
                                hyphenator={hyphenator}
                                isReadingMode={true}
                                forceNoMargin={true}
                                forceShowSyllables={true}
                            />
                        </div>
                    ))}
                </div>

                {/* Success Checkmark */}
                {isCorrect && (
                    <div className="mt-6 flex items-center gap-2 text-green-600 font-bold text-xl pop-animate">
                        <Icons.Check size={32} strokeWidth={3} /> Richtig!
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-4">
                {!isCorrect ? (
                    <button
                        onClick={checkOrder}
                        className={`px-8 py-2.5 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all min-touch-target flex items-center gap-2 ${isShaking ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <Icons.Check size={20} /> Prüfen
                    </button>
                ) : (
                    <button
                        onClick={nextSentence}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 pop-animate min-touch-target"
                    >
                        {currentIndex < sentences.length - 1 ? 'Nächster Satz' : 'Fertig!'}
                        <Icons.ArrowRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
