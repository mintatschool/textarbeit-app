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

    // 2. Generate Targets
    const availableTargets = useMemo(() => {
        if (!text) return [];
        const targets = [];
        const lowerText = text.toLowerCase();

        const activeClusters = settings.clusters && settings.clusters.length > 0 ? settings.clusters : DEFAULT_CLUSTERS;

        // Clusters
        activeClusters.forEach(cluster => {
            const lowCluster = cluster.toLowerCase();
            if (lowerText.includes(lowCluster)) {
                let label = "";

                // Special Rule: "ie" and "chs" stay lowercase
                if (lowCluster === 'ie' || lowCluster === 'chs') {
                    label = lowCluster;
                } else {
                    // Always show "Au au" format
                    const cap = cluster.charAt(0).toUpperCase() + cluster.slice(1).toLowerCase();
                    label = `${cap} ${cluster.toLowerCase()}`;
                }

                targets.push({
                    label: label,
                    value: lowCluster,
                    type: 'cluster'
                });
            }
        });

        // Single Letters
        const letters = new Set();
        for (let char of lowerText) {
            if (char.match(/[a-zäöüß]/)) {
                letters.add(char);
            }
        }

        const sortedLetters = Array.from(letters).sort((a, b) => a.localeCompare(b, 'de'));
        sortedLetters.forEach(l => {
            const upper = l.toUpperCase();
            // Always show "A a" format
            const label = `${upper} ${l}`;

            targets.push({
                label: label,
                value: l,
                type: 'single'
            });
        });

        return targets.sort((a, b) => a.label.localeCompare(b.label, 'de'));
    }, [text, settings.clusters]);

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

    // 3. Pre-calculate Correct Indices for selected target
    const targetIndices = useMemo(() => {
        const set = new Set();
        if (!selectedTarget || !processedWords.length) return set;

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
                                    for (let k = 0; k < clLen; k++) {
                                        set.add(wordStartIndex + currentSylStart + clusterStart + k);
                                    }
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
                        for (let k = 0; k < targetValue.length; k++) {
                            set.add(wordStartIndex + idx + k);
                        }
                    }
                } else {
                    for (let k = 0; k < targetValue.length; k++) {
                        set.add(wordStartIndex + idx + k);
                    }
                }
                searchPos = idx + 1;
            }
        });
        return set;
    }, [selectedTarget, processedWords, settings.clusters]);

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
                    setFlashMode('correct');
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
                        <button
                            onClick={() => setShowSelection(true)}
                            className={`ml-1 flex items-center gap-3 px-3 py-1 border-2 rounded-xl transition-all duration-300 group animate-[fadeIn_0.3s] ${flashMode === 'correct' ? 'bg-green-100 border-green-400 scale-105' : flashMode === 'wrong' ? 'bg-red-100 border-red-400 animate-shake' : 'bg-slate-100 hover:bg-white border-transparent hover:border-blue-300'}`}
                        >
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Gesucht:</span>
                            <span className={`text-xl font-black transition-colors duration-300 ${flashMode === 'correct' ? 'text-green-600' : flashMode === 'wrong' ? 'text-red-600' : 'text-blue-800'}`} style={{ fontFamily: settings.fontFamily }}>
                                {selectedTarget?.label || "?"}
                            </span>
                            <Icons.ChevronDown size={16} className="text-slate-400 group-hover:text-blue-500" />
                        </button>
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
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 flex flex-col gap-2">
                        {availableTargets.map((target) => (
                            <button
                                key={target.label}
                                onClick={() => { setSelectedTarget(target); setShowSelection(false); }}
                                className={`w-full p-4 text-left font-bold rounded-xl transition-all border-2 flex items-center justify-between group ${selectedTarget?.label === target.label ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-transparent hover:bg-slate-100 text-slate-700'}`}
                            >
                                <span className="text-2xl" style={{ fontFamily: settings.fontFamily }}>{target.label}</span>
                                {selectedTarget?.label === target.label && <Icons.Check size={20} className="text-blue-600" />}
                            </button>
                        ))}
                    </div>
                </div>

                {showSelection && (
                    <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] transition-opacity" onClick={() => setShowSelection(false)}></div>
                )}

                <div className="flex-1 flex flex-col relative z-10 w-full bg-slate-50/50">
                    <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 flex justify-center w-full relative">
                        {/* Selected Indicator - Massive Backdrop (Darker Blue) */}
                        <div className="absolute top-8 left-4 md:left-8 opacity-60 pointer-events-none z-0">
                            <div
                                className={`text-[8.5rem] md:text-[13rem] font-black transition-all duration-300 select-none leading-none ${flashMode === 'correct' ? 'text-green-500 scale-105' :
                                    flashMode === 'wrong' ? 'text-red-500 animate-shake' :
                                        'text-slate-600'
                                    }`}
                                style={{ fontFamily: settings.fontFamily }}
                            >
                                {selectedTarget?.label}
                            </div>
                        </div>

                        <div className="max-w-7xl w-full pt-8 pb-24 relative pl-16 md:pl-48 transition-all">
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
