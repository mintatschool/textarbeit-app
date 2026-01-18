import React, { useState, useEffect, useRef } from 'react';
import { Word } from './Word';
import { Icons } from './Icons';
import { ProgressBar } from './ProgressBar';
import { EmptyStateMessage } from './EmptyStateMessage';

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
const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

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
        setSentences(allSentences);
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
        const shuffled = shuffle(wordObjects);
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
            {showReward && (
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

            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 shrink-0 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Shuffle className="text-blue-600" /> {title || "Schüttelsätze"}
                    </h2>
                    <div className="flex items-center gap-2">
                        {sentences.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${completedSentences.has(idx)
                                    ? 'bg-green-500 text-white'
                                    : idx === currentIndex
                                        ? 'bg-blue-600 text-white scale-110 shadow-md'
                                        : 'bg-gray-100 text-gray-300'
                                    }`}
                            >
                                {completedSentences.has(idx) ? <Icons.Check size={16} /> : idx + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="20"
                            max="128"
                            value={settings.fontSize}
                            onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"
                    >
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

            <ProgressBar progress={progress} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scroll">


                {/* Word Cards Container */}
                <div
                    id="word-container"
                    className={`flex flex-wrap justify-center items-center max-w-[95vw] p-4 rounded-2xl transition-all duration-300 ${isCorrect ? 'bg-green-50' : 'bg-white'
                        }`}
                    style={{ columnGap: `${(settings.wordSpacing ?? 0.3)}em`, rowGap: '1em' }}
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
                            className={`word-card px-4 py-2 rounded-xl shadow-sm select-none transition-all duration-200 touch-action-none touch-manipulation touch-none ${word.color} ${isCorrect
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
                        <Icons.CheckCircle size={32} strokeWidth={3} /> Richtig!
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-200 flex justify-center gap-4">
                {!isCorrect ? (
                    <button
                        onClick={checkOrder}
                        className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all min-touch-target"
                    >
                        Prüfen
                    </button>
                ) : (
                    <button
                        onClick={nextSentence}
                        className="px-10 py-4 bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2 pop-animate min-touch-target"
                    >
                        {currentIndex < sentences.length - 1 ? 'Nächster Satz' : 'Fertig!'}
                        <Icons.ArrowRight size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};
