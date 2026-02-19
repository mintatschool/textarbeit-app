import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from './Icons';
import { speak } from '../utils/speech';
import { ExerciseHeader } from './ExerciseHeader';
import { RewardModal } from './shared/RewardModal';
import { shuffleArray } from '../utils/arrayUtils';
import { getChunks } from '../utils/syllables';
import { EmptyStateMessage } from './EmptyStateMessage';
import { getTerm } from '../utils/terminology';

// Simple Keyboard Layout (Embedded for now or imported if separate file created)
// Assuming we created CustomKeyboard in the previous step
import { CustomKeyboard } from './CustomKeyboard';
import { Word } from './Word';

export const WordWritingView = ({ words, settings, setSettings, onClose, title, hyphenator }) => {
    if (!words || words.length === 0) return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans">
            <EmptyStateMessage onClose={onClose} IconComponent={Icons.Edit2} title="Keine Wörter verfügbar" />
        </div>
    );

    // Filter relevant words (must have text) and shuffle them ONCE
    const validWords = useMemo(() => {
        const filtered = words.filter(w => w.word && w.word.trim().length > 0);
        return shuffleArray([...filtered]);
    }, [words]);

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showReward, setShowReward] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isShowingCorrect, setIsShowingCorrect] = useState(false);

    // Settings State
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Hint State (Scrambled Letters)
    const [showHint, setShowHint] = useState(false);
    const [shuffledLetters, setShuffledLetters] = useState([]);

    const currentWordObj = validWords[currentIndex];
    const targetWord = currentWordObj ? currentWordObj.word : '';

    // Initialize/Reset for new word
    useEffect(() => {
        setUserInput('');
        setIsError(false);
        setIsCorrect(false);
        setIsShowingCorrect(false);
        if (targetWord) {
            // Split word into chunks (letter combinations)
            const chunks = getChunks(targetWord, true);
            const chunkObjects = chunks.map((text, index) => ({
                text,
                isFirst: index === 0
            }));

            if (chunkObjects.length > 1) {
                let scrambled = shuffleArray([...chunkObjects]);
                let attempts = 0;
                // Check if scrambled is identical to original sequence
                while (scrambled.map(s => s.text).join('') === targetWord && attempts < 10) {
                    scrambled = shuffleArray([...chunkObjects]);
                    attempts++;
                }
                setShuffledLetters(scrambled);
            } else {
                setShuffledLetters(chunkObjects);
            }
        }
    }, [currentIndex, targetWord]);

    const handleKeyPress = (char) => {
        if (isCorrect || isShowingCorrect) return; // Block input if already solved
        setIsError(false);
        setUserInput(prev => prev + char);
    };

    const handleBackspace = () => {
        if (isCorrect || isShowingCorrect) return;
        setIsError(false);
        setUserInput(prev => prev.slice(0, -1));
    };





    const playAudio = (text) => {
        if (audioEnabled) {
            speak(text);
        }
    };

    // Derived State for Progress
    const progressPercentage = ((currentIndex) / validWords.length) * 100;

    // Cloud SVG Path (Same as WordCloudView)
    const cloudSVGPath = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";

    // Dynamic Font Size for Hints & Cloud
    // Base size 1.5rem (text-2xl/3xl), scaled by settings.fontSize (usually 14-24)
    const storedFontSize = settings?.fontSize || 20;
    // Limit max font size for hint to prevent it from bursting the cloud
    const hintFontSize = `${Math.min(storedFontSize * 1.5, 48)}px`;

    // Cloud Sizing: grow with font size, but strictly limited to avoid layout breakage
    // Max height should be about 35-40% of viewport height to leave room for input (20%) and keyboard (40%)
    // Base width 320px (w-80) for fontSize 20.
    const scaleFactor = Math.min(2.0, storedFontSize / 20); // Cap scale factor at 2.0 (previously 2.5)

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Calculate max available height for cloud (approx 35% of screen)
    const maxCloudHeight = viewportHeight * 0.35;

    const desiredWidth = 320 * scaleFactor;
    // Maintain aspect ratio but allow it to be wider
    // Standard aspect 1.6 -> 2.0 for more horizontal space
    const aspect = 2.0; // width / height

    let cloudHeight = desiredWidth / aspect;
    let cloudWidth = desiredWidth;

    if (cloudHeight > maxCloudHeight) {
        cloudHeight = maxCloudHeight;
        cloudWidth = cloudHeight * aspect;
    }

    // Ensure it fits width too
    if (cloudWidth > viewportWidth - 32) {
        cloudWidth = viewportWidth - 32;
        cloudHeight = cloudWidth / aspect;
    }

    const [activeKey, setActiveKey] = useState(null);

    // Hardware Keyboard Support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isCorrect || isShowingCorrect) {
                if (e.key === 'Enter') {
                    handleNext();
                    e.preventDefault();
                }
                return;
            }

            // Alpha-numeric check (including German umlauts)
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Allow letters & Space (if needed)
                if (/^[a-zA-ZäöüÄÖÜß ]$/.test(e.key)) {
                    handleKeyPress(e.key);
                    setActiveKey(e.key);
                    setTimeout(() => setActiveKey(null), 150);
                }
            } else if (e.key === 'Backspace') {
                handleBackspace();
                setActiveKey('Backspace');
                setTimeout(() => setActiveKey(null), 150);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                handleCheck();
                setActiveKey('Enter');
                setTimeout(() => setActiveKey(null), 150);
                e.preventDefault();
            } else if (e.key === 'Shift') {
                setActiveKey('Shift');
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                setActiveKey(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isCorrect, isShowingCorrect, userInput, targetWord, audioEnabled]);

    const handleCheck = () => {
        if (isCorrect) {
            handleNext();
            return;
        }

        // Strict Case Sensitivity Check
        if (userInput.trim() === targetWord) {
            setIsCorrect(true);
            setIsShowingCorrect(true); // Transition immediately to solution state
        } else {
            setIsError(true);
            setTimeout(() => setIsError(false), 500);
        }
    };

    const handleNext = () => {
        // Otherwise just try to move on or check
        if (isCorrect) {
            moveToNext();
        } else {
            handleCheck();
        }
    };

    const moveToNext = () => {
        if (currentIndex < validWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowReward(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans safe-area-bottom">
            <RewardModal
                isOpen={showReward}
                onClose={onClose}
                message="Alle Wörter geschrieben! Fantastisch!"
            />

            <ExerciseHeader
                title="Wörter schreiben"
                icon={Icons.Edit2}
                current={currentIndex + 1}
                total={validWords.length}
                progressPercentage={progressPercentage}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMax={48}
                customControls={
                    <>
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={audioEnabled ? 'Audio an' : 'Audio aus'}
                        >
                            {audioEnabled ? <Icons.Volume2 size={20} /> : <Icons.VolumeX size={20} />}
                        </button>

                        <button
                            onClick={() => setShowHint(!showHint)}
                            className={`px-3 py-2 rounded-xl transition-all flex items-center justify-center border ${showHint ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
                            title="Hilfe"
                        >
                            <Icons.WordHelp size={48} />
                        </button>
                    </>
                }
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-start pt-0 -mt-4 sm:-mt-6 p-2 gap-0 overflow-hidden w-full max-w-4xl mx-auto pb-2 relative">

                {/* Visual Area (Cloud) - Height Constrained */}
                <div
                    className="relative flex items-center justify-center transition-all bg-contain bg-no-repeat bg-center shrink-0"
                    style={{
                        width: `${cloudWidth}px`,
                        height: `${cloudHeight}px`
                    }}
                >
                    {/* Cloud Graphic */}
                    <div className="absolute inset-0 text-blue-100 drop-shadow-sm flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                            <path d={cloudSVGPath} fill="currentColor" stroke="#93c5fd" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                    </div>

                    {/* Content inside Cloud */}
                    <div className="relative z-10 flex flex-wrap justify-center items-center gap-4 p-8 w-full h-full overflow-hidden">
                        {showHint ? (
                            // Hint ON: Show Scrambled Chunks
                            shuffledLetters.map((chunk, i) => (
                                <span
                                    key={i}
                                    className={`drop-shadow-sm select-none ${chunk.isFirst ? 'font-black' : 'font-normal'}`}
                                    style={{
                                        fontFamily: settings.fontFamily,
                                        fontSize: hintFontSize,
                                        letterSpacing: '0.1em',
                                        marginRight: '0.2em',
                                        color: chunk.isFirst ? '#1e3a8a' : '#1e40af' // Slightly darker blue for the bold one
                                    }}
                                >
                                    {chunk.text}
                                </span>
                            ))
                        ) : (
                            // Hint OFF: Show Speaker Button (Large)
                            <button
                                onClick={() => playAudio(targetWord)}
                                className={`rounded-full flex items-center justify-center shadow-lg transition-all ring-4 ring-white/50 hover:scale-105 active:scale-95 ${audioEnabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                                style={{ width: Math.min(80, cloudHeight * 0.5), height: Math.min(80, cloudHeight * 0.5) }}
                                disabled={!audioEnabled}
                            >
                                {audioEnabled ? <Icons.Volume2 size={Math.min(40, cloudHeight * 0.25)} /> : <Icons.VolumeX size={Math.min(40, cloudHeight * 0.25)} />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full flex items-center justify-center gap-4 shrink-0 z-20">
                    <div
                        className={`relative w-full max-w-lg rounded-2xl flex items-center justify-center font-bold tracking-wider transition-all
                            ${isShowingCorrect
                                ? 'bg-green-50/30 border border-green-400 shadow-sm rounded-3xl px-12 py-4 text-slate-800'
                                : isCorrect
                                    ? 'bg-green-50 border-4 border-green-400 shadow-inner text-green-700'
                                    : isError
                                        ? 'bg-red-50 border-4 border-red-400 shadow-inner text-red-700 animate-shake'
                                        : 'bg-white border-4 border-slate-200 shadow-inner text-slate-800'
                            }
                        `}
                        style={{
                            fontFamily: settings.fontFamily,
                            fontSize: `${Math.min(Math.max(24, (settings.fontSize || 20) * 1.5), 60)}px`,
                            height: isShowingCorrect ? 'auto' : `${Math.max(80, Math.min(Math.max(24, (settings.fontSize || 20) * 1.5), 60) * 2.0)}px`,
                            minHeight: isShowingCorrect ? '0' : '80px'
                        }}
                    >
                        {isShowingCorrect ? (
                            <Word
                                word={targetWord}
                                settings={settings}
                                forceShowSyllables={true}
                                hyphenator={hyphenator}
                                isReadingMode={true}
                                hideSelectionFrame={true}
                                customFontSize={Math.min(Math.max(24, (settings.fontSize || 20) * 1.5), 60)}
                            />
                        ) : (
                            <>
                                {userInput}
                                {/* Blinking Cursor (only if not solved) */}
                                {!isCorrect && <span className="w-1 h-3/5 bg-slate-400 animate-pulse ml-1 rounded-full opacity-50"></span>}
                            </>
                        )}

                        {isCorrect && !isShowingCorrect && (
                            <div className="absolute right-4 text-green-500 animate-[popIn_0.3s_ease-out]">
                                <Icons.Check size={32} />
                            </div>
                        )}
                    </div>

                    {/* Speaker Button (Small) - Only shown if Hint is ON */}
                    {showHint && (
                        <button
                            onClick={() => playAudio(targetWord)}
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all ring-4 ring-white/50 hover:scale-105 active:scale-95 shrink-0 ${audioEnabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                            disabled={!audioEnabled}
                        >
                            {audioEnabled ? <Icons.Volume2 size={24} /> : <Icons.VolumeX size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Keyboard Area - Fixed Bottom */}
            <div className="w-full z-50">
                <div className="w-full h-full flex flex-col justify-end">
                    <CustomKeyboard
                        onKeyPress={handleKeyPress}
                        onBackspace={handleBackspace}
                        onEnter={handleNext}
                        settings={settings}
                        activeKey={activeKey}
                    />
                </div>
            </div>
        </div >
    );
};
