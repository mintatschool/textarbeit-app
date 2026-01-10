import React, { useState, useEffect, useMemo } from 'react';
import Hypher from 'hypher';
import german from 'hyphenation.de';
import { Icons } from './Icons';
import { Word } from './Word';
import { getCachedSyllables } from '../utils/syllables';

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
            let label = "";
            if (lowCluster === 'ie' || lowCluster === 'chs') {
                label = lowCluster;
            } else {
                label = `${capCluster} ${lowCluster}`;
            }

            if (countCap > 0 || countLow > 0) {
                targets.push({
                    label: label,
                    value: lowCluster,
                    type: 'cluster',
                    counts: { upper: countCap, lower: countLow }
                });
            }
        });

        // Single Letters (Include ALL letters a-z, ä, ö, ü, ß as requested)
        const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyzäöüß";
        const lettersList = ALL_LETTERS.split("");

        lettersList.forEach(l => {
            // ß has no uppercase variant in common usage, show only lowercase
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

    // Compatible with Word component's expected signature
    // The Word component calls: toggleHighlights(indicesToToggle)
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
                // Only flash if the clicked item is actually a target
                const isCorrectHit = indexArray.some(i => targetIndices.has(i));
                if (isCorrectHit) {
                    // Check if it's an uppercase or lowercase hit
                    // We assume the first index in the array gives us a clue
                    let firstIdx = indexArray[0];
                    // Find which segment this index belongs to
                    let foundChar = '';
                    // Iterate processedWords to find the character at this global index
                    // This is a bit expensive but robust
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
            setTimeout(() => {
                setShowCorrection(false);
                setMissedIndices(new Set());
                setWrongIndices(new Set());
            }, 2500);
        }
    };

    const displayWordColors = useMemo(() => {
        const colors = {};
        markedIndices.forEach(idx => colors[idx] = 'yellow');
        if (showCorrection) {
            missedIndices.forEach(idx => colors[idx] = '#fecaca'); // Light Red for missed
            wrongIndices.forEach(idx => colors[idx] = '#ef4444'); // Strong Red for wrong
        }
        return colors;
    }, [markedIndices, showCorrection, missedIndices, wrongIndices]);

    // Z-Index 100 to cover Toolbar (z-90)
    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none animate-fadeIn">
            {/* Header */}
            <div className="bg-white px-2 py-3 shadow-sm flex justify-between items-center z-20 shrink-0 border-b border-slate-100">
                <div className="flex flex-col items-start px-1">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-1.5 pl-0.5">
                        <Icons.LetterSearch size={28} className="text-blue-600" /> {title || "Buchstaben finden"}
                    </h2>

                    {!showSelection && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowSelection(true)}
                                className={`ml-1 flex items-center gap-3 px-3 py-1 border-2 rounded-xl transition-all duration-300 group animate-[fadeIn_0.3s] ${flashMode && flashMode.startsWith('correct') ? 'bg-green-100 border-green-400 scale-105' : flashMode === 'wrong' ? 'bg-red-100 border-red-400 animate-shake' : 'bg-slate-100 hover:bg-white border-transparent hover:border-blue-300'
                                    }`}
                            >
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Gesucht:</span>
                                <span className={`text-xl font-black transition-colors duration-300 ${flashMode && flashMode.startsWith('correct') ? 'text-green-600' : flashMode === 'wrong' ? 'text-red-600' : 'text-blue-800'
                                    }`} style={{ fontFamily: settings.fontFamily }}>
                                    {selectedTarget?.label || "?"}
                                </span>
                                <Icons.ChevronDown size={16} className="text-slate-400 group-hover:text-blue-500" />
                            </button>

                            {selectedTarget && targetHits.length > 0 && (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                        <span className="text-sm font-bold text-blue-800">
                                            {(() => {
                                                const foundHits = targetHits.filter(hit =>
                                                    Array.from(hit).every(idx => markedIndices.has(idx))
                                                ).length;
                                                return `${foundHits} / ${targetHits.length}`;
                                            })()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-tighter">gefunden</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input
                            type="range"
                            min="16"
                            max="120"
                            step="2"
                            value={settings.fontSize}
                            onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                            className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>

                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>

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
                                // Base size: 1.125rem (18px)
                                // Max bonus: 1.375rem (22px)
                                // Total range: 1.125rem to 2.5rem
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
                    <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] transition-opacity" onClick={() => setShowSelection(false)}></div>
                )}

                <div className="flex-1 flex flex-col relative z-10 w-full bg-slate-50/50">
                    <div className="flex-1 overflow-y-auto custom-scroll p-0 flex justify-start w-full relative">
                        <div className="w-full pt-24 pb-24 relative flex items-start transition-all">
                            {/* Selected Indicator - Sticky Left Column */}
                            <div className="sticky top-0 shrink-0 z-0 select-none pl-10">
                                <div
                                    className={`text-[7rem] md:text-[10rem] font-black transition-all duration-300 leading-none flex items-baseline ${flashMode === 'wrong' ? 'animate-shake' : ''
                                        }`}
                                    style={{ fontFamily: settings.fontFamily }}
                                >
                                    {(() => {
                                        if (!selectedTarget) return null;
                                        const parts = selectedTarget.label.split(' ');
                                        // Case 1: Single part (e.g. "ie" or just "A" if strict mode)
                                        // Actually our logic produces "A a" or "Ch ch" or just "ie"

                                        if (parts.length === 1) {
                                            return (
                                                <span className={`transition-all duration-300 ${flashMode === 'correct-lower' || flashMode === 'correct-upper' ? 'text-green-500 scale-105' :
                                                    flashMode === 'wrong' ? 'text-red-500' : 'text-slate-600'
                                                    }`}>
                                                    {parts[0]}
                                                </span>
                                            );
                                        }

                                        // Case 2: Two parts (Upper Lower)
                                        return (
                                            <>
                                                <span className={`transition-all duration-300 ${flashMode === 'correct-upper' ? 'text-green-500 scale-105' :
                                                    flashMode === 'wrong' ? 'text-red-500' : 'text-slate-600'
                                                    }`}>
                                                    {parts[0]}
                                                </span>
                                                <span className="whitespace-pre"> </span>
                                                <span className={`transition-all duration-300 ${flashMode === 'correct-lower' ? 'text-green-500 scale-105' :
                                                    flashMode === 'wrong' ? 'text-red-500' : 'text-slate-600'
                                                    }`}>
                                                    {parts[1]}
                                                </span>
                                            </>
                                        );
                                    })()}
                                    &nbsp;&nbsp;&nbsp;
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <div className={`flex flex-wrap items-baseline content-start ${settings.centerText ? 'justify-center' : 'justify-start'}`} style={{ lineHeight: settings.lineHeight, fontFamily: settings.fontFamily }}>
                                    {(() => {
                                        // Optimization: Calculate settings once for the loop
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
                                                    activeColor="yellow" // Force Yellow Mode Trigger
                                                    settings={wordSettings} // Use robust settings object
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

                    <div className="p-6 bg-white border-t border-slate-200 flex justify-center shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={handleCheck}
                            disabled={markedIndices.size === 0 || success}
                            className="px-16 py-4 bg-blue-600 text-white rounded-2xl font-bold text-2xl shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
                        >
                            <Icons.Check size={32} /> Prüfen
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
                                <Icons.CheckCircle size={64} className="text-green-500" /> Alles gefunden! Super!
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
