import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { RewardModal } from './shared/RewardModal';
import { ExerciseHeader } from './ExerciseHeader';
import { EmptyStateMessage } from './EmptyStateMessage';
import { shuffleArray } from '../utils/arrayUtils';
import { getTerm } from '../utils/terminology';

export const SplitExerciseView = ({ words, onClose, settings, setSettings, title }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[130] bg-slate-100 modal-animate font-sans flex flex-col items-center justify-center"><EmptyStateMessage onClose={onClose} /></div>);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userArcs, setUserArcs] = useState([]); // Array of { start: idx, end: idx }
    const [showVowels, setShowVowels] = useState(true);
    const [status, setStatus] = useState('idle');
    const [isSessionFinished, setIsSessionFinished] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isError, setIsError] = useState(false);

    // New local state for variant: 'arc' or 'line'
    const [variant, setVariant] = useState('arc');

    // Randomize words only once on mount or words change
    const randomWords = useMemo(() => {
        return shuffleArray(words);
    }, [words]);

    const currentWordObj = randomWords[currentIndex];
    const fullWord = currentWordObj ? currentWordObj.word : '';
    const correctSyllables = currentWordObj ? currentWordObj.syllables : [];
    const progress = isSessionFinished ? 100 : ((currentIndex) / (words ? words.length : 1)) * 100;

    // Reset state on new word
    useEffect(() => {
        setUserArcs([]);
        setStatus('idle');
    }, [currentIndex]);

    // Calculate correct split points
    const correctArcs = useMemo(() => {
        const arcs = [];
        let acc = 0;
        correctSyllables.forEach((syl) => {
            const start = acc;
            const end = acc + syl.length;
            arcs.push({ start, end });
            acc += syl.length;
        });
        return arcs;
    }, [correctSyllables]);

    const vowelStatus = useMemo(() => {
        const statuses = new Array(fullWord.length).fill(null);
        const text = fullWord.toLowerCase();
        const diphthongs = ['eu', 'äu', 'au', 'ei', 'ie', 'ai'];
        const singleVowels = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü'];
        let i = 0;
        while (i < text.length) {
            let foundDiphthong = false;
            for (let d of diphthongs) {
                if (text.startsWith(d, i)) {
                    statuses[i] = { type: 'start' };
                    if (d.length > 1) {
                        for (let k = 1; k < d.length - 1; k++) statuses[i + k] = { type: 'mid' };
                        statuses[i + d.length - 1] = { type: 'end' };
                    } else {
                        statuses[i] = { type: 'single' };
                    }
                    i += d.length;
                    foundDiphthong = true;
                    break;
                }
            }
            if (foundDiphthong) continue;
            if (singleVowels.includes(text[i])) {
                statuses[i] = { type: 'single' };
            }
            i++;
        }
        return statuses;
    }, [fullWord]);

    // --- Drawing Logic ---
    const [dragStart, setDragStart] = useState(null); // { index, x, y }
    const [currentDragPos, setCurrentDragPos] = useState(null); // { x, y }
    const containerRef = useRef(null);
    const dotRefs = useRef({});

    const scaleFactor = settings.fontSize / 48;
    const dotSize = Math.max(18, 24 * scaleFactor);
    const strokeWidth = Math.max(3, 6 * scaleFactor);
    const verticalOffset = (-2 * scaleFactor) - (dotSize / 4);

    const charWidth = settings.fontSize * 1.5;
    const spacing = dotSize * 1.2;

    const headerControls = (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowVowels(!showVowels)}
                className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all min-touch-target ${showVowels ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_2px_0_0_#eab308]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
                {getTerm("Vokale", settings)}
            </button>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); setVariant('arc'); setUserArcs([]); }}
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${variant === 'arc' ? 'bg-white shadow-md ring-1 ring-slate-200 scale-110 z-10' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                    title="Silbenbögen"
                >
                    <Icons.SyllableArc size={44} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setVariant('line'); setUserArcs([]); }}
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${variant === 'line' ? 'bg-white shadow-md ring-1 ring-slate-200 scale-110 z-10' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                    title="Striche"
                >
                    <Icons.SyllableLine size={44} />
                </button>
            </div>
        </div>
    );

    const getDotPosition = (index) => {
        const dot = dotRefs.current[index];
        if (!dot || !containerRef.current) return null;
        const dotRect = dot.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        return {
            x: dotRect.left - containerRect.left + dotRect.width / 2,
            y: dotRect.top - containerRect.top + dotRect.height / 2
        };
    };

    const handleDotDown = (e, index) => {
        if (status === 'correct') return;
        e.preventDefault();
        e.stopPropagation();

        if (variant === 'line') {
            // Line Variant: Click to toggle line/split
            if (index === 0 || index === fullWord.length) return; // Cannot split outer boundaries

            setUserArcs(prev => {
                // In line mode, we think in split points.
                // splitPoints = [3, 5] -> arcs = [0,3], [3,5], [5, length]
                const splitPoints = new Set();
                prev.forEach(arc => {
                    if (arc.start > 0) splitPoints.add(arc.start);
                    if (arc.end < fullWord.length) splitPoints.add(arc.end);
                });

                if (splitPoints.has(index)) {
                    splitPoints.delete(index);
                } else {
                    splitPoints.add(index);
                }

                const sortedPoints = Array.from(splitPoints).sort((a, b) => a - b);
                const nextArcs = [];
                let acc = 0;
                for (const p of sortedPoints) {
                    nextArcs.push({ start: acc, end: p });
                    acc = p;
                }
                nextArcs.push({ start: acc, end: fullWord.length });
                return nextArcs;
            });
            setStatus('idle');
            setIsError(false);
            return;
        }

        // Arc Variant: Start Drag
        const pos = getDotPosition(index);
        if (pos) {
            setDragStart({ index, ...pos });
            setCurrentDragPos(pos);
        }
    };

    const handlePointerMove = (e) => {
        if (variant === 'line') return;
        if (!dragStart || !containerRef.current) return;
        e.preventDefault();
        const containerRect = containerRef.current.getBoundingClientRect();
        setCurrentDragPos({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        });
    };

    const handlePointerUp = (e) => {
        if (variant === 'line') return;
        if (!dragStart) return;

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const dropX = e.clientX - containerRect.left;
        const dropY = e.clientY - containerRect.top;

        // Find nearest dot within threshold
        let foundIndex = -1;
        let minDist = 60 * scaleFactor;

        for (let i = 0; i <= fullWord.length; i++) {
            if (i === dragStart.index) continue;

            const pos = getDotPosition(i);
            if (pos) {
                const dist = Math.hypot(pos.x - dropX, pos.y - dropY);
                if (dist < minDist) {
                    minDist = dist;
                    foundIndex = i;
                }
            }
        }

        if (foundIndex !== -1) {
            const start = Math.min(dragStart.index, foundIndex);
            const end = Math.max(dragStart.index, foundIndex);

            const isOverlap = userArcs.some(arc => {
                return (start < arc.end && end > arc.start);
            });

            if (!isOverlap) {
                const newArc = { start, end };
                setUserArcs(prev => {
                    const next = [...prev, newArc];
                    next.sort((a, b) => a.start - b.start);
                    return next;
                });

                setStatus('idle');
                setIsError(false);
            } else {
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 300);
            }
        }

        setDragStart(null);
        setCurrentDragPos(null);
    };

    const handleArcClick = (index) => {
        if (status === 'correct') return;
        setUserArcs(prev => prev.filter((_, i) => i !== index));
        setStatus('idle');
    };

    const checkAnswer = () => {
        if (variant === 'line') {
            // In line mode, if no splits yet, user hasn't finished (except for 1-syllable words, but those are rarely used for splitting)
            // Actually, we just compare the segments.
            // Empty userArcs in line mode means one segment [0, length].
            const currentSegments = userArcs.length === 0 ? [{ start: 0, end: fullWord.length }] : userArcs;

            if (currentSegments.length !== correctArcs.length) {
                handleWrong();
                return;
            }

            const correctSet = new Set(correctArcs.map(a => `${a.start}-${a.end}`));
            const userSet = new Set(currentSegments.map(a => `${a.start}-${a.end}`));
            const isCorrect = [...userSet].every(x => correctSet.has(x));

            if (isCorrect) {
                setStatus('correct');
            } else {
                handleWrong();
            }
            return;
        }

        // Arc mode
        if (userArcs.length !== correctArcs.length) {
            handleWrong();
            return;
        }

        const correctSet = new Set(correctArcs.map(a => `${a.start}-${a.end}`));
        const userSet = new Set(userArcs.map(a => `${a.start}-${a.end}`));
        const isCorrect = [...userSet].every(x => correctSet.has(x));

        if (isCorrect) {
            setStatus('correct');
        } else {
            handleWrong();
        }
    };

    const handleWrong = () => {
        setStatus('wrong');
        setIsShaking(true);
        setIsError(true);
        setTimeout(() => {
            setIsShaking(false);
            setIsError(false);
            setStatus('idle');
        }, 500);
    };

    const nextWord = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsSessionFinished(true);
        }
    };

    const generatePath = (startIdx, endIdx, isCurrent = false) => {
        const p1 = getDotPosition(startIdx);
        const p2 = isCurrent && currentDragPos ? currentDragPos : getDotPosition(endIdx);

        if (!p1 || !p2) return "";

        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const width = maxX - minX;

        const midX = (p1.x + p2.x) / 2;
        const curveDepth = 40 * scaleFactor + (width * 0.25);
        const midY = Math.max(p1.y, p2.y) + curveDepth;

        return `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
    };

    if (!currentWordObj) return null;

    // POST-Check View (Standard Syllable View)
    if (status === 'correct') {
        const postCheckSyllables = correctSyllables;
        return (
            <div className="fixed inset-0 z-[130] flex flex-col bg-slate-100 modal-animate font-sans select-none">
                <RewardModal isOpen={isSessionFinished} onClose={onClose} message="Alle Wörter richtig getrennt! Super!" />
                <ExerciseHeader
                    title={title || "Wörter trennen"}
                    icon={Icons.Scissors}
                    current={currentIndex + 1}
                    total={words.length}
                    progressPercentage={progress}
                    settings={settings}
                    setSettings={setSettings}
                    onClose={onClose}
                    customControls={headerControls}
                />
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50">
                    <div className="flex flex-wrap justify-center items-end py-4 animate-fadeIn gap-x-6">
                        {(() => {
                            let charOffset = 0;
                            return postCheckSyllables.map((syl, idx) => {
                                const isEven = idx % 2 === 0;
                                let arcColor = isEven ? '#2563eb' : '#dc2626';
                                const displayCharWidth = settings.fontSize * 1.3;
                                const sylStart = charOffset;
                                charOffset += syl.length;

                                return (
                                    <div key={idx} className="relative flex items-center justify-center pb-10" style={{ fontFamily: settings.fontFamily }}>
                                        <div className="flex select-none">
                                            {syl.split('').map((char, charIdx) => {
                                                const globalIdx = sylStart + charIdx;
                                                const vStat = vowelStatus[globalIdx];
                                                let vowelClass = "";
                                                let borderStyle = "";
                                                if (showVowels && vStat) {
                                                    vowelClass = "bg-yellow-100";
                                                    if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm";
                                                    else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md";
                                                    else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md";
                                                    else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid";
                                                }

                                                return (
                                                    <div
                                                        key={charIdx}
                                                        className="flex justify-center shrink-0"
                                                        style={{
                                                            width: `${displayCharWidth}px`,
                                                            fontSize: `${settings.fontSize * 2.5}px`
                                                        }}
                                                    >
                                                        <span className={`font-bold leading-none text-slate-800 ${vowelClass} ${borderStyle}`}><span className="relative z-10">{char}</span></span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <svg className="absolute bottom-0 left-0 w-full h-10 pointer-events-none overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                                            <path d="M 5 2 Q 50 25 95 2" fill="none" stroke={arcColor} strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="flex flex-col items-center gap-4 min-h-[4rem] mt-8">
                        <p className="text-green-600 font-bold text-2xl pop-animate flex items-center gap-2"><Icons.Check size={28} /> Richtig!</p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-white border-t flex flex-wrap gap-4 justify-end items-center shrink-0">
                    <div className="flex-1"></div>
                    <button onClick={nextWord} className="px-8 py-2.5 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition flex items-center gap-2 pop-animate min-touch-target">
                        {currentIndex < words.length - 1 ? 'Nächstes Wort' : 'Fertig'} <Icons.ArrowRight />
                    </button>
                </div>
            </div>
        );
    }

    // MAIN INTERACTIVE VIEW
    return (
        <div
            className="fixed inset-0 z-[130] flex flex-col bg-slate-100 modal-animate font-sans select-none touch-none"
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
        >
            <ExerciseHeader
                title={title || "Wörter trennen"}
                icon={Icons.Scissors}
                current={currentIndex + 1}
                total={words.length}
                progressPercentage={progress}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={24}
                sliderMax={75}
                customControls={headerControls}
            />

            <div className={`flex-1 flex flex-col items-center justify-center p-4 bg-white/50 overflow-hidden ${isShaking ? 'shake' : ''}`}>

                <div
                    ref={containerRef}
                    className="relative flex items-end justify-center px-10"
                    style={{
                        fontFamily: settings.fontFamily,
                        paddingBottom: `${100 * scaleFactor}px`,
                        paddingTop: `${20 * scaleFactor}px`
                    }}
                >
                    {/* --- LINE VARIANT UI --- */}
                    {variant === 'line' && (
                        <div className="flex flex-wrap justify-center items-end select-none" style={{ fontFamily: settings.fontFamily }}>
                            {fullWord.split('').map((char, i) => {
                                const vStat = vowelStatus[i];
                                let vowelClass = "";
                                let borderStyle = "";
                                if (showVowels && vStat) {
                                    vowelClass = "bg-yellow-100";
                                    if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm";
                                    else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md";
                                    else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md";
                                    else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid";
                                }

                                // Determine if there's a split after this character
                                // userArcs in line mode = [{start: 0, end: 3}, {start: 3, end: 5}]
                                // So a split point exists at index if it's the end of an arc (except the last one fullWord.length)
                                const hasSplit = userArcs.some(arc => arc.end === i + 1 && arc.end !== fullWord.length);

                                return (
                                    <React.Fragment key={i}>
                                        <div className="relative flex flex-col items-center justify-end">
                                            <div className={`font-bold leading-none px-0 py-1 transition-all ${isError ? 'text-red-500' : 'text-slate-800'} ${vowelClass} ${borderStyle}`} style={{ fontSize: `${settings.fontSize * 2.5}px` }}>
                                                <span className="relative z-10">{char}</span>
                                            </div>
                                        </div>
                                        {i < fullWord.length - 1 && (
                                            <div
                                                onClick={() => {
                                                    // Toggle split at i + 1
                                                    const index = i + 1;
                                                    setUserArcs(prev => {
                                                        const splitPoints = new Set();
                                                        prev.forEach(arc => {
                                                            if (arc.start > 0) splitPoints.add(arc.start);
                                                            if (arc.end < fullWord.length) splitPoints.add(arc.end);
                                                        });

                                                        if (splitPoints.has(index)) {
                                                            splitPoints.delete(index);
                                                        } else {
                                                            splitPoints.add(index);
                                                        }

                                                        const sortedPoints = Array.from(splitPoints).sort((a, b) => a - b);
                                                        const nextArcs = [];
                                                        let acc = 0;
                                                        for (const p of sortedPoints) {
                                                            nextArcs.push({ start: acc, end: p });
                                                            acc = p;
                                                        }
                                                        nextArcs.push({ start: acc, end: fullWord.length });
                                                        return nextArcs;
                                                    });
                                                }}
                                                className="group relative w-6 md:w-12 h-24 md:h-40 -mb-4 cursor-pointer flex justify-center items-end hover:bg-blue-50 rounded mx-1 transition-colors"
                                            >
                                                <div className={`w-2 md:w-3 h-20 md:h-32 mb-3 md:mb-5 rounded-full transition-all duration-200 ${hasSplit ? 'bg-blue-600 shadow-lg scale-y-100' : 'bg-slate-200 scale-y-70 group-hover:scale-y-85'}`}></div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* --- ARC VARIANT UI --- */}
                    {variant === 'arc' && (
                        <>
                            {/* SVG Layer */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                                {/* Completed Arcs (Archive mode) */}
                                {userArcs.map((arc, i) => {
                                    const isEven = i % 2 === 0;
                                    return (
                                        <path
                                            key={i}
                                            d={generatePath(arc.start, arc.end)}
                                            fill="none"
                                            stroke={isEven ? '#2563eb' : '#dc2626'}
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            className="pointer-events-auto cursor-pointer hover:opacity-75 transition-opacity"
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleArcClick(i);
                                            }}
                                        />
                                    );
                                })}

                                {/* Current Drag Arc */}
                                {dragStart && currentDragPos && (
                                    <path
                                        d={generatePath(dragStart.index, null, true)}
                                        fill="none"
                                        stroke="#94a3b8"
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray="8 4"
                                        className="opacity-80"
                                    />
                                )}
                            </svg>

                            {/* Letters and Dots */}
                            {fullWord.split('').map((char, i) => (
                                <React.Fragment key={i}>
                                    {/* Dot before char (i=0) */}
                                    {i === 0 && (
                                        <div
                                            className="relative flex flex-col justify-end items-center shrink-0"
                                            style={{ width: `${spacing}px` }}
                                        >
                                            <div
                                                ref={el => dotRefs.current[0] = el}
                                                onPointerDown={(e) => handleDotDown(e, 0)}
                                                className={`rounded-full transition-all z-20 touch-manipulation bg-slate-300 cursor-pointer hover:bg-slate-400 hover:scale-110`}
                                                style={{
                                                    width: `${dotSize}px`,
                                                    height: `${dotSize}px`,
                                                    marginBottom: `${verticalOffset}px`
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Character */}
                                    <div
                                        className="flex flex-col justify-end items-center shrink-0"
                                        style={{ width: `${charWidth}px` }}
                                    >
                                        {(() => {
                                            const vStat = vowelStatus[i];
                                            let vowelClass = "";
                                            let borderStyle = "";
                                            if (showVowels && vStat) {
                                                vowelClass = "bg-yellow-100";
                                                if (vStat.type === 'single') borderStyle = "shadow-border-yellow rounded-sm";
                                                else if (vStat.type === 'start') borderStyle = "shadow-border-yellow-left rounded-l-md";
                                                else if (vStat.type === 'end') borderStyle = "shadow-border-yellow-right rounded-r-md";
                                                else if (vStat.type === 'mid') borderStyle = "shadow-border-yellow-mid";
                                            }
                                            return (
                                                <span
                                                    className={`font-bold leading-none select-none ${isError ? 'text-red-500' : 'text-slate-800'} ${vowelClass} ${borderStyle}`}
                                                    style={{ fontSize: `${settings.fontSize * 2.5}px` }}
                                                >
                                                    <span className="relative z-10">{char}</span>
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {/* Dot after char (index = i + 1) - Suppress if inside a diphthong bridge */}
                                    {(() => {
                                        const vStat = vowelStatus[i];
                                        const nextVstat = vowelStatus[i + 1];
                                        const isDiphthongBridge = vStat && nextVstat && (
                                            (vStat.type === 'start' && (nextVstat.type === 'mid' || nextVstat.type === 'end')) ||
                                            (vStat.type === 'mid' && (nextVstat.type === 'mid' || nextVstat.type === 'end'))
                                        );
                                        if (isDiphthongBridge) return null;

                                        return (
                                            <div
                                                className="relative flex flex-col justify-end items-center shrink-0"
                                                style={{ width: `${spacing}px` }}
                                            >
                                                <div
                                                    ref={el => dotRefs.current[i + 1] = el}
                                                    onPointerDown={(e) => handleDotDown(e, i + 1)}
                                                    className={`rounded-full transition-all z-20 touch-manipulation cursor-pointer hover:scale-110 bg-slate-300 hover:bg-slate-400`}
                                                    style={{
                                                        width: `${dotSize}px`,
                                                        height: `${dotSize}px`,
                                                        marginBottom: `${verticalOffset}px`
                                                    }}
                                                />
                                            </div>
                                        );
                                    })()}
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 min-h-[4rem] mt-8">
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t flex flex-wrap gap-4 justify-end items-center shrink-0">
                <div className="flex-1"></div>
                <button
                    onClick={checkAnswer}
                    className={`px-8 py-2.5 text-white text-lg font-bold rounded-xl shadow-lg active:scale-95 transition min-touch-target flex items-center gap-2 ${isShaking ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    <Icons.Check size={20} /> Prüfen
                </button>
            </div>
        </div>
    );
};
