import React, { useState, useEffect, useMemo } from 'react';
import Hypher from 'hypher';
import german from 'hyphenation.de';
import { Icons } from './Icons';
import { Word } from './Word';
import { getCachedSyllables } from '../utils/syllables';
import { ProgressBar } from './ProgressBar';
import { ExerciseHeader } from './ExerciseHeader';

// Ensure standard clusters are available
const DEFAULT_CLUSTERS = ['Au', 'Ei', 'Eu', 'Äu', 'Ai', 'Ch', 'Sch', 'Sp', 'St', 'Pf', 'Ph', 'Qu', 'Ck', 'Tz', 'Ie'];

export const FindLettersView = ({ text, settings, setSettings, onClose, title }) => {
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [markedIndices, setMarkedIndices] = useState(new Set());
    const [showCorrection, setShowCorrection] = useState(false);
    const [success, setSuccess] = useState(false);
    const [missedIndices, setMissedIndices] = useState(new Set());
    const [showSelection, setShowSelection] = useState(true);
    const [flashMode, setFlashMode] = useState(null); // null | 'correct' | 'wrong'
    const [isShaking, setIsShaking] = useState(false);

    const hyphenator = useMemo(() => new Hypher(german), []);

    // 1. Process Words
    const processedWords = useMemo(() => {
        if (!text) return [];
        const segments = text.split(/(\s+)/);
        let currentIndex = 0;
        return segments.map((segment, idx) => {
            const startIndex = currentIndex;
            currentIndex += segment.length;

            if (segment.match(/^\s+$/)) {
                if (segment.includes('\n')) {
                    const newlines = segment.match(/\n/g).length;
                    return { id: `nl-${startIndex}`, type: 'newline', count: newlines, content: segment };
                }
                return { id: `space-${startIndex}`, type: 'space', content: segment };
            }

            const match = segment.match(/^([^\w\u00C0-\u017F]*)([\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);
            if (match) {
                const prefix = match[1];
                const cleanWord = match[2]; // e.g. "Haus"
                const suffix = match[3];
                const wordStartIndex = startIndex + prefix.length;
                const key = `${cleanWord}_${wordStartIndex}`;
                const syllables = getCachedSyllables(cleanWord, hyphenator);
                return { type: 'word', word: cleanWord, prefix, suffix, index: wordStartIndex, id: key, syllables };
            }
            return { type: 'text', content: segment, index: startIndex, id: `text_${startIndex}` };
        });
    }, [text, hyphenator]);

    // 2. Frequency Calculation Logic
    const frequencyCounts = useMemo(() => {
        const counts = {};
        const activeClusters = settings.clusters && settings.clusters.length > 0 ? settings.clusters : DEFAULT_CLUSTERS;

        processedWords.forEach(item => {
            if (item.type !== 'word') return;
            const wordText = item.word;
            const syllables = item.syllables;

            // Track characters consumed by clusters
            const consumed = new Array(wordText.length).fill(false);

            // 1. Count Clusters (Syllable-driven)
            let currentSylStart = 0;
            syllables.forEach(sylText => {
                const sylLower = sylText.toLowerCase();
                const sylWordStart = currentSylStart;

                activeClusters.forEach(cluster => {
                    const clLower = cluster.toLowerCase();
                    let clPos = sylLower.indexOf(clLower);
                    while (clPos !== -1) {
                        // Special rule for st/sp: only at syllable start
                        if ((clLower === 'st' || clLower === 'sp') && clPos !== 0) {
                            clPos = sylLower.indexOf(clLower, clPos + 1);
                            continue;
                        }

                        const actualClusterText = wordText.substring(sylWordStart + clPos, sylWordStart + clPos + cluster.length);
                        counts[actualClusterText] = (counts[actualClusterText] || 0) + 1;

                        for (let i = 0; i < cluster.length; i++) {
                            consumed[sylWordStart + clPos + i] = true;
                        }
                        clPos = sylLower.indexOf(clLower, clPos + 1);
                    }
                });
                currentSylStart += sylText.length;
            });

            // 2. Count remaining individual characters
            for (let i = 0; i < wordText.length; i++) {
                if (!consumed[i]) {
                    const char = wordText[i];
                    if (char.match(/[a-zäöüßA-ZÄÖÜ]/i)) {
                        counts[char] = (counts[char] || 0) + 1;
                    }
                }
            }
        });
        return counts;
    }, [processedWords, settings.clusters]);

    // 3. Generate Targets
    const availableTargets = useMemo(() => {
        const targets = [];
        const activeClusters = settings.clusters && settings.clusters.length > 0 ? settings.clusters : DEFAULT_CLUSTERS;

        // Clusters
        activeClusters.forEach(cluster => {
            const lowCluster = cluster.toLowerCase();
            const capCluster = cluster.charAt(0).toUpperCase() + cluster.slice(1).toLowerCase();

            const countCap = frequencyCounts[capCluster] || 0;
            const countLow = frequencyCounts[lowCluster] || 0;

            // Special Rule: "ie" and "chs" stay lowercase
            const label = (lowCluster === 'ie' || lowCluster === 'chs') ? lowCluster : `${capCluster} ${lowCluster}`;

            if (countCap > 0 || countLow > 0) {
                targets.push({
                    label: label,
                    value: lowCluster,
                    type: 'cluster',
                    counts: { upper: countCap, lower: countLow }
                });
            }
        });

        // Single Letters
        const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyzäöüß";
        ALL_LETTERS.split("").forEach(l => {
            if (l === 'ß') {
                const countLower = frequencyCounts[l] || 0;
                targets.push({
                    label: 'ß',
                    value: l,
                    type: 'single',
                    counts: { upper: 0, lower: countLower }
                });
            } else {
                const upper = l.toUpperCase();
                const countUpper = frequencyCounts[upper] || 0;
                const countLower = frequencyCounts[l] || 0;

                targets.push({
                    label: `${upper} ${l}`,
                    value: l,
                    type: 'single',
                    counts: { upper: countUpper, lower: countLower }
                });
            }
        });

        return targets.sort((a, b) => a.label.localeCompare(b.label, 'de'));
    }, [frequencyCounts, settings.clusters]);

    useEffect(() => {
        if (availableTargets.length > 0 && !selectedTarget) {
            setSelectedTarget(availableTargets[0]);
        }
    }, [availableTargets, selectedTarget]);

    const [wrongIndices, setWrongIndices] = useState(new Set());

    useEffect(() => {
        setMarkedIndices(new Set());
        setShowCorrection(false);
        setSuccess(false);
        setMissedIndices(new Set());
        setWrongIndices(new Set());
    }, [selectedTarget]);

    // 3. Pre-calculate Correct Indices and individual Hits for selected target
    const targetHits = useMemo(() => {
        const hits = [];
        if (!selectedTarget || !processedWords.length) return hits;

        const targetValue = selectedTarget.value.toLowerCase();
        const activeClusters = settings.clusters && settings.clusters.length > 0 ? settings.clusters : DEFAULT_CLUSTERS;

        processedWords.forEach(item => {
            if (item.type !== 'word') return;

            const wordStartIndex = item.index;
            const fullWordLower = item.word.toLowerCase();
            const syllables = item.syllables;

            let searchPos = 0;
            while (searchPos < fullWordLower.length) {
                const idx = fullWordLower.indexOf(targetValue, searchPos);
                if (idx === -1) break;

                let currentSylStart = 0;
                let targetSylIndex = -1;
                let indexInSyl = -1;

                for (let i = 0; i < syllables.length; i++) {
                    const sylLen = syllables[i].length;
                    if (idx >= currentSylStart && idx < currentSylStart + sylLen) {
                        targetSylIndex = i;
                        indexInSyl = idx - currentSylStart;
                        break;
                    }
                    currentSylStart += sylLen;
                }

                if (targetSylIndex !== -1) {
                    const sylText = syllables[targetSylIndex].toLowerCase();
                    let foundCluster = false;
                    for (let cluster of activeClusters) {
                        const clLen = cluster.length;
                        let clPos = sylText.indexOf(cluster);
                        while (clPos !== -1) {
                            if ((cluster === 'st' || cluster === 'sp') && clPos !== 0) {
                                clPos = sylText.indexOf(cluster, clPos + 1);
                                continue;
                            }
                            const hitStart = indexInSyl;
                            const hitEnd = indexInSyl + targetValue.length;
                            const clusterStart = clPos;
                            const clusterEnd = clPos + clLen;

                            if (hitStart >= clusterStart && hitEnd <= clusterEnd) {
                                if (targetValue === cluster) {
                                    const hitSet = new Set();
                                    for (let k = 0; k < clLen; k++) {
                                        hitSet.add(wordStartIndex + currentSylStart + clusterStart + k);
                                    }
                                    hits.push(hitSet);
                                    foundCluster = true;
                                    break;
                                } else {
                                    foundCluster = true;
                                    break;
                                }
                            }
                            clPos = sylText.indexOf(cluster, clPos + 1);
                        }
                        if (foundCluster) break;
                    }
                    if (!foundCluster) {
                        const hitSet = new Set();
                        for (let k = 0; k < targetValue.length; k++) {
                            hitSet.add(wordStartIndex + idx + k);
                        }
                        hits.push(hitSet);
                    }
                } else {
                    const hitSet = new Set();
                    for (let k = 0; k < targetValue.length; k++) {
                        hitSet.add(wordStartIndex + idx + k);
                    }
                    hits.push(hitSet);
                }
                searchPos = idx + 1;
            }
        });
        return hits;
    }, [selectedTarget, processedWords, settings.clusters]);

    const targetIndices = useMemo(() => {
        const set = new Set();
        targetHits.forEach(hit => {
            hit.forEach(idx => set.add(idx));
        });
        return set;
    }, [targetHits]);

    // NEW: Helper to check if a specific hit index corresponds to an uppercase or lowercase letter
    const getHitCase = (hitIndex) => {
        for (const item of processedWords) {
            if (item.type === 'word' && hitIndex >= item.index && hitIndex < item.index + item.word.length) {
                const char = item.word[hitIndex - item.index];
                return (char === char.toUpperCase() && char !== char.toLowerCase()) ? 'upper' : 'lower';
            }
        }
        return 'lower'; // Fallback
    };

    // NEW: Calculate detailed stats
    const stats = useMemo(() => {
        if (!selectedTarget) return { upper: { found: 0, total: 0 }, lower: { found: 0, total: 0 } };

        const upperTotal = Math.max(selectedTarget.counts?.upper || 0, 0);
        const lowerTotal = Math.max(selectedTarget.counts?.lower || 0, 0);

        let upperFound = 0;
        let lowerFound = 0;

        markedIndices.forEach(idx => {
            if (targetIndices.has(idx)) {
                if (getHitCase(idx) === 'upper') upperFound++;
                else lowerFound++;
            }
        });

        return {
            upper: { found: Math.min(upperFound, upperTotal), total: upperTotal },
            lower: { found: Math.min(lowerFound, lowerTotal), total: lowerTotal }
        };
    }, [selectedTarget, markedIndices, targetIndices, processedWords]);

    // NEW: Progress Percentage
    const progressPercentage = useMemo(() => {
        const total = stats.upper.total + stats.lower.total;
        if (total === 0) return 100;
        return ((stats.upper.found + stats.lower.found) / total) * 100;
    }, [stats]);


    const handleToggleHighlights = (indices) => {
        if (showCorrection || success) return;
        const indexArray = Array.isArray(indices) ? indices : [indices];
        setMarkedIndices(prev => {
            const next = new Set(prev);
            const allPresent = indexArray.every(i => next.has(i));

            if (allPresent) {
                indexArray.forEach(i => next.delete(i));
            } else {
                indexArray.forEach(i => next.add(i));
                const isCorrectHit = indexArray.some(i => targetIndices.has(i));
                if (isCorrectHit) {
                    let firstIdx = indexArray[0];
                    let foundChar = '';
                    for (const item of processedWords) {
                        if (item.type === 'word' && firstIdx >= item.index && firstIdx < item.index + item.word.length) {
                            foundChar = item.word[firstIdx - item.index];
                            break;
                        }
                    }

                    if (foundChar && foundChar === foundChar.toUpperCase() && foundChar !== foundChar.toLowerCase()) {
                        setFlashMode('correct-upper');
                    } else {
                        setFlashMode('correct-lower');
                    }
                    setTimeout(() => setFlashMode(null), 400);
                } else {
                    setFlashMode('wrong');
                    setTimeout(() => setFlashMode(null), 400);
                }
            }
            return next;
        });
    };

    const handleCheck = () => {
        if (!selectedTarget) return;

        const missed = [];
        targetIndices.forEach(idx => { if (!markedIndices.has(idx)) missed.push(idx); });

        const wrong = [];
        markedIndices.forEach(idx => { if (!targetIndices.has(idx)) wrong.push(idx); });

        if (missed.length === 0 && wrong.length === 0) {
            setSuccess(true);
        } else {
            setMissedIndices(new Set(missed));
            setWrongIndices(new Set(wrong));
            setShowCorrection(true);
            setIsShaking(true);
            setTimeout(() => {
                setShowCorrection(false);
                setIsShaking(false);
                setMissedIndices(new Set());
                setWrongIndices(new Set());
            }, 2500);
        }
    };

    const displayWordColors = useMemo(() => {
        const colors = {};
        markedIndices.forEach(idx => colors[idx] = 'yellow');
        if (showCorrection) {
            missedIndices.forEach(idx => colors[idx] = '#fecaca');
            wrongIndices.forEach(idx => colors[idx] = '#ef4444');
        }
        return colors;
    }, [markedIndices, showCorrection, missedIndices, wrongIndices]);

    // Z-Index 100 to cover Toolbar (z-90)
    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none animate-fadeIn">
            <ExerciseHeader
                title={title || "Buchstaben finden"}
                icon={Icons.LetterSearch}

                progressPercentage={progressPercentage}
                settings={settings}
                setSettings={setSettings}
                onClose={onClose}
                sliderMin={16}
                sliderMax={120}
            >
                {/* Sub-Header with Target Selection and Counts */}
                <div className="px-4 py-2 border-t border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSelection(true)}
                            className={`flex items-center gap-3 px-4 py-2 bg-slate-100/80 border-2 rounded-2xl transition-all duration-300 group hover:bg-white hover:border-blue-300 ${flashMode === 'wrong' ? 'border-red-400 animate-shake' : 'border-transparent'}`}
                        >
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">GESUCHT:</span>
                            <span className={`text-2xl font-black transition-colors duration-300 ${flashMode && flashMode.startsWith('correct') ? 'text-green-600' : flashMode === 'wrong' ? 'text-red-600' : 'text-blue-700'
                                }`} style={{ fontFamily: settings.fontFamily }}>
                                {selectedTarget?.label || "?"}
                            </span>
                            <Icons.ChevronDown size={20} className="text-slate-400 group-hover:text-blue-500" />
                        </button>
                    </div>

                    {selectedTarget && (
                        <div className="flex items-center gap-3">
                            {/* Uppercase Bubble */}
                            {stats.upper.total > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 border-2 border-blue-100 rounded-2xl">
                                    <span className="text-xl font-bold text-slate-700" style={{ fontFamily: settings.fontFamily }}>
                                        {selectedTarget.label.split(' ')[0]}
                                    </span>
                                    <span className="text-xl font-black text-blue-700">
                                        {stats.upper.found} / {stats.upper.total}
                                    </span>
                                </div>
                            )}

                            {/* Lowercase Bubble */}
                            {stats.lower.total > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 border-2 border-blue-100 rounded-2xl">
                                    <span className="text-xl font-bold text-slate-700" style={{ fontFamily: settings.fontFamily }}>
                                        {selectedTarget.label.split(' ').pop()}
                                    </span>
                                    <span className="text-xl font-black text-blue-700">
                                        {stats.lower.found} / {stats.lower.total}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ExerciseHeader>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar Overlay */}
                <div
                    className={`absolute inset-y-0 left-0 bg-white border-r border-slate-200 z-30 transition-all duration-300 shadow-xl flex flex-col ${showSelection ? 'translate-x-0 w-80' : '-translate-x-full w-80'}`}
                >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Auswahl</span>
                        <button onClick={() => setShowSelection(false)} className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300"><Icons.X size={16} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 flex flex-col gap-1">
                        {(() => {
                            const maxCount = Math.max(...availableTargets.map(t => (t.counts?.upper || 0) + (t.counts?.lower || 0)), 1);

                            return availableTargets.map((target) => {
                                const totalCount = (target.counts?.upper || 0) + (target.counts?.lower || 0);
                                const isEmpty = totalCount === 0;

                                // Frequency-based scaling
                                const scale = totalCount / maxCount;
                                const labelSize = 1.125 + (scale * 1.375);
                                const countSize = 0.875 + (scale * 0.375);

                                return (
                                    <button
                                        key={target.label}
                                        onClick={() => { setSelectedTarget(target); setShowSelection(false); }}
                                        className={`w-full px-4 py-3 text-left font-bold rounded-xl transition-all border-2 flex items-center justify-between group ${selectedTarget?.label === target.label ? 'border-blue-600 bg-blue-50 text-blue-800' : isEmpty ? 'border-transparent text-slate-400' : 'border-transparent hover:bg-slate-100 text-slate-700'}`}
                                    >
                                        <div className="flex items-baseline gap-2">
                                            <span style={{ fontFamily: settings.fontFamily, fontSize: `${labelSize}rem`, lineHeight: 1 }}>{target.label}</span>
                                            <div className={`font-medium ${isEmpty ? 'text-slate-400' : 'text-slate-400'}`} style={{ fontFamily: settings.fontFamily, fontSize: `${countSize}rem` }}>
                                                ({target.counts.upper}/{target.counts.lower})
                                            </div>
                                        </div>
                                        {selectedTarget?.label === target.label && <Icons.Check size={20} className="text-blue-600 shrink-0" />}
                                    </button>
                                );
                            });
                        })()}
                    </div>
                </div>

                {showSelection && (
                    <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] transition-opacity" onClick={() => setShowSelection(false)}></div>
                )}

                <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden bg-slate-50/50">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Selected Indicator - Fixed Left Column */}
                        <div className="shrink-0 bg-white/40 border-r border-slate-100 flex flex-col items-center pt-12 px-12 z-10">
                            <div
                                className={`text-[7rem] md:text-[10rem] font-black transition-all duration-300 leading-none flex items-baseline ${flashMode === 'wrong' ? 'animate-shake' : ''
                                    }`}
                                style={{ fontFamily: settings.fontFamily }}
                            >
                                {(() => {
                                    if (!selectedTarget) return null;
                                    const parts = selectedTarget.label.split(' ');
                                    if (parts.length === 1) {
                                        return (
                                            <span className={`inline-block transition-all duration-300 ${flashMode && flashMode.startsWith('correct') ? 'text-green-500' :
                                                flashMode === 'wrong' ? 'text-red-500' : 'text-blue-700'
                                                }`}>
                                                {parts[0]}
                                            </span>
                                        );
                                    }
                                    return (
                                        <>
                                            <span className={`inline-block transition-all duration-300 ${flashMode === 'correct-upper' ? 'text-green-500' :
                                                flashMode === 'wrong' ? 'text-red-500' : 'text-blue-700'
                                                }`}>
                                                {parts[0]}
                                            </span>
                                            <span className="whitespace-pre"> </span>
                                            <span className={`inline-block transition-all duration-300 ${flashMode === 'correct-lower' ? 'text-green-500' :
                                                flashMode === 'wrong' ? 'text-red-500' : 'text-blue-700'
                                                }`}>
                                                {parts[1]}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Words Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scroll w-full relative h-full">
                            <div className="w-full pt-12 pb-24 px-12 transition-all">
                                <div className={`flex flex-wrap items-baseline content-start ${settings.centerText ? 'justify-center' : 'justify-start'}`} style={{ lineHeight: settings.lineHeight, fontFamily: settings.fontFamily }}>
                                    {(() => {
                                        const activeClustersRaw = settings.clusters && settings.clusters.length > 0 ? settings.clusters : DEFAULT_CLUSTERS;
                                        const activeClustersLower = activeClustersRaw.map(c => c.toLowerCase());
                                        const wordSettings = {
                                            ...settings,
                                            smartSelection: true,
                                            clusters: activeClustersLower
                                        };

                                        return processedWords.map((item) => {
                                            if (item.type === 'newline') return <div key={item.id} className="w-full basis-full" style={{ height: item.count > 1 ? '1.5em' : '0' }}></div>;
                                            if (item.type === 'space') return <span key={item.id} className="select-none inline-block whitespace-pre">{item.content}</span>;
                                            if (item.type === 'text') return <span key={item.id} className="text-slate-800 break-words" style={{ fontSize: `${settings.fontSize}px` }}>{item.content}</span>;

                                            const currentWordColors = {};
                                            for (let i = 0; i < item.word.length; i++) {
                                                const gIdx = item.index + i;
                                                if (displayWordColors[gIdx]) currentWordColors[gIdx] = displayWordColors[gIdx];
                                            }

                                            return (
                                                <Word
                                                    key={item.id}
                                                    {...item}
                                                    startIndex={item.index}
                                                    isHighlighted={Object.keys(currentWordColors).length > 0}
                                                    highlightedIndices={markedIndices}
                                                    isHidden={false}
                                                    toggleHighlights={handleToggleHighlights}
                                                    toggleHidden={() => { }}
                                                    activeTool={null}
                                                    activeColor="yellow"
                                                    settings={wordSettings}
                                                    manualSyllables={item.syllables}
                                                    hyphenator={hyphenator}
                                                    onEditMode={() => { }}
                                                    isReadingMode={false}
                                                    wordColors={currentWordColors}
                                                    colorPalette={[]}
                                                />
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={handleCheck}
                            disabled={markedIndices.size === 0 || success}
                            className={`px-8 py-2.5 text-white rounded-xl font-bold text-lg shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale ${isShaking ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                        >
                            <Icons.Check size={20} /> Prüfen
                        </button>
                    </div>
                </div>
            </div>

            {success && (
                <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px]"></div>
                    <div className="bg-white rounded-3xl p-12 shadow-2xl pop-animate pointer-events-auto text-center border-b-8 border-green-100 relative z-10">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-green-600 mb-8 flex items-center gap-3">
                                <Icons.Check size={64} className="text-green-500" /> Alles gefunden! Super!
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
        </div>
    );
};
