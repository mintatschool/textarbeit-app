import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hypher from 'hypher';
import german from 'hyphenation.de';
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import { Icons } from './components/Icons';
import { Word } from './components/Word';
import { SettingsModal } from './components/SettingsModal';
import { QRCodeModal } from './components/QRCodeModal';
import { QRScannerModal } from './components/QRScannerModal';
import { CorrectionModal } from './components/CorrectionModal';
import { SplitExerciseView } from './components/SplitExerciseView';
import { SyllablePuzzleView } from './components/SyllablePuzzleView';
import { WordCloudView } from './components/WordCloudView';
import { SyllableCarpetView } from './components/SyllableCarpetView';
import { WordListView } from './components/WordListView';
import { SentencePuzzleView } from './components/SentencePuzzleView';
import { SentenceShuffleView } from './components/SentenceShuffleView';
import { StaircaseView } from './components/StaircaseView';
import { GapWordsView } from './components/GapWordsView';
import { GapSentencesView } from './components/GapSentencesView';
import { GapTextView } from './components/GapTextView';
import { Toolbar } from './components/Toolbar';
import { getCachedSyllables } from './utils/syllables';

// Initialize mobile-drag-drop polyfill
polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    holdToDrag: 150
});
import "mobile-drag-drop/default.css";



const useHypherLoader = () => {
    const [hyphenatorInstance, setHyphenatorInstance] = useState(null);
    useEffect(() => {
        // Since we import locally in Vite, we can just instantiate
        setHyphenatorInstance(new Hypher(german));
        // console.log("Hyphenator disabled for debugging");
    }, []);
    return { instance: hyphenatorInstance, loading: false };
};

const App = () => {
    const [text, setText] = useState("");
    const [isViewMode, setIsViewMode] = useState(false);
    const [settings, setSettings] = useState({
        fontSize: 32,
        lineHeight: 2.2,
        wordSpacing: 0.4,
        visualType: 'block',
        displayTrigger: 'click',
        fontFamily: "'Patrick Hand', cursive",
        enableCamera: false,
        clickAction: 'yellow_border',
        zoomActive: false,
        zoomScale: 1.2,
        lockScroll: false,
        centerText: false,
        smartSelection: true,
        textWidth: 80
    });
    const [highlightedIndices, setHighlightedIndices] = useState(new Set());
    const [hiddenIndices, setHiddenIndices] = useState(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [logo, setLogo] = useState(null);
    const [activeTool, setActiveTool] = useState(null); // 'split', 'blur'
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionData, setCorrectionData] = useState(null);
    const [manualCorrections, setManualCorrections] = useState({}); // { "Wort_Index": ["Syl","ben"] }
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [columnsState, setColumnsState] = useState({ cols: {}, order: [] });
    // View States
    const [activeView, setActiveView] = useState('text'); // text, puzzle, cloud, list, carpet, sentence, split, gapWords, gapSentences, gapText
    const [sentencePuzzleState, setSentencePuzzleState] = useState(null);

    const textAreaRef = useRef(null);
    const { instance: hyphenator } = useHypherLoader();

    // Smart Text Update that shifts highlights
    const handleTextChange = (newText) => {
        const oldText = text;
        const lengthDiff = newText.length - oldText.length;

        if (lengthDiff === 0) {
            setText(newText);
            return;
        }

        // Find start of change
        let diffStart = 0;
        // Optimization: if simple append, diffStart is oldText.length.
        // But we need safe bounds.
        const minLen = Math.min(oldText.length, newText.length);
        while (diffStart < minLen && oldText[diffStart] === newText[diffStart]) {
            diffStart++;
        }

        // Shift indices
        if (highlightedIndices.size > 0) {
            const newHighlights = new Set();
            highlightedIndices.forEach(idx => {
                if (idx < diffStart) {
                    newHighlights.add(idx); // Before change, keep
                } else {
                    // After change, shift
                    if (lengthDiff < 0) {
                        // Deletion.
                        // If idx was in the deleted range [diffStart, diffStart + deletedAmount], it is gone.
                        // deletedAmount = -lengthDiff.
                        // Deleted range indices: diffStart ... diffStart + (-lengthDiff) - 1.
                        if (idx >= diffStart - lengthDiff) { // idx >= diffStart + deletedAmount
                            newHighlights.add(idx + lengthDiff);
                        }
                    } else {
                        // Insertion
                        newHighlights.add(idx + lengthDiff);
                    }
                }
            });
            setHighlightedIndices(newHighlights);
        }
        setText(newText);
    };

    // Data Management
    const loadState = (jsonData) => {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (data.text) setText(data.text);
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
            if (data.highlights) setHighlightedIndices(new Set(data.highlights));
            if (data.hidden) setHiddenIndices(new Set(data.hidden));
            if (data.logo) setLogo(data.logo);
            if (data.manualCorrections) setManualCorrections(data.manualCorrections);
            if (data.columnsState) setColumnsState(data.columnsState);
            setIsViewMode(true);
        } catch (e) { alert("Fehler beim Laden der Datei."); }
    };
    const exportState = () => {
        const data = { text, settings, highlights: Array.from(highlightedIndices), hidden: Array.from(hiddenIndices), logo, manualCorrections, columnsState };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'textarbeit-export.json'; a.click();
    };

    // Interactions
    const toggleHighlights = useCallback((indicesStrOrArr) => {
        setHighlightedIndices(prev => {
            const next = new Set(prev);
            const indices = Array.isArray(indicesStrOrArr) ? indicesStrOrArr : [indicesStrOrArr];
            const allHas = indices.every(i => next.has(i));
            indices.forEach(i => { if (allHas) next.delete(i); else next.add(i); });
            return next;
        });
    }, []);
    const toggleHidden = useCallback((key) => {
        setHiddenIndices(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    }, []);
    const handleCorrectionSave = (newSyllables) => {
        setManualCorrections(prev => ({ ...prev, [correctionData.key]: newSyllables }));
        setShowCorrectionModal(false); setCorrectionData(null); setActiveTool(null);
    };

    // Prepare content
    // Input Mode is handled via Overlay in this design or separate view
    // Restoring the "Input" overlay logic that sits on top or toggles
    // We used to have { !isViewMode && ... textarea ... }

    // NOTE: In the previous step I cut out the Input Area JSX. I need to restore it properly inside the return.
    // The structure should be: 
    // <div ...>
    //    {/* Input Overlay */}
    //    <div className={`fixed inset-0 z-[60] bg-slate-50 ... ${isViewMode ? '-translate-x-full' : 'translate-x-0'}`}> ... </div>
    //    
    //    {/* Main View */}
    //    <nav ... side bar />
    //    <main ... />
    // </div>

    // Let's fix the App return structure to include the Input Area AND the Main View

    const processedWords = useMemo(() => {
        if (!text) return [];
        const segments = text.split(/(\s+)/);
        let currentIndex = 0;
        return segments.map((segment, idx) => {
            const startIndex = currentIndex;
            currentIndex += segment.length;

            // Check for newlines
            if (segment.match(/^\s+$/)) {
                if (segment.includes('\n')) {
                    // Count newlines to determine spacing height? 
                    // For now, just a semantic break. 
                    // We can map each \n to a break
                    const newlines = segment.match(/\n/g).length;
                    return { id: `nl-${startIndex}`, type: 'newline', count: newlines, content: segment };
                }
                return { id: `space-${startIndex}`, type: 'space', content: segment };
            }

            // Simple logic to separate punctuation
            const match = segment.match(/^([^\w\u00C0-\u017F]*)([\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);
            if (match) {
                const prefix = match[1];
                const cleanWord = match[2];
                const suffix = match[3];
                // Word starts after prefix
                const wordStartIndex = startIndex + prefix.length;
                const key = `${cleanWord}_${wordStartIndex}`;
                const syllables = manualCorrections[key] || getCachedSyllables(cleanWord, hyphenator);
                return { type: 'word', word: cleanWord, prefix, suffix, index: wordStartIndex, id: key, syllables };
            }
            return { type: 'text', content: segment, index: startIndex, id: `text_${startIndex}` };
        });
    }, [text, manualCorrections, hyphenator]);

    // Handle Printing
    const handlePrint = (type) => {
        const style = document.createElement('style');
        style.innerHTML = `@media print { nav, button, .no-print { display: none !important; } body { padding: 0 !important; margin: 0 !important; } .print-content { display: block !important; } }`;
        document.head.appendChild(style);
        if (type === 'text') { window.print(); }
        else {
            setActiveView(type);
            setTimeout(() => { window.print(); setActiveView('text'); document.head.removeChild(style); }, 500);
        }
    };

    // Fullscreen
    const toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { if (document.exitFullscreen) document.exitFullscreen(); } };



    const wordsOnly = processedWords.filter(w => w.type === 'word');
    // If words are highlighted, only use those for exercises. Otherwise use all.
    const exerciseWords = highlightedIndices.size > 0
        ? wordsOnly.filter(w => highlightedIndices.has(w.index))
        : wordsOnly;

    return (
        <div className={`min-h-screen flex flex-col bg-slate-50 transition-colors duration-500 ${settings.lockScroll ? 'overflow-hidden fixed w-full h-full' : ''}`}>

            {isViewMode && (
                <Toolbar
                    isViewMode={isViewMode}
                    isReadingMode={activeTool === 'read'}
                    activeTool={activeTool}
                    isFullscreen={!!document.fullscreenElement}
                    text={text}
                    enableCamera={settings.enableCamera}
                    isLoading={false}

                    onToggleView={() => {
                        if (isViewMode) {
                            setIsViewMode(false);
                            setActiveTool(null);
                            setActiveView('text');
                        } else {
                            setIsViewMode(true);
                        }
                    }}
                    onResetHighlights={() => setHighlightedIndices(new Set())}
                    onToggleReadingMode={() => setActiveTool(activeTool === 'read' ? null : 'read')}
                    onToggleFullscreen={toggleFullscreen}
                    onToolChange={setActiveTool}
                    onOpenSettings={() => setShowSettings(true)}
                    onClearText={() => { if (window.confirm('Text wirklich löschen?')) setText(''); }}
                    onOpenScanner={() => setShowScanner(true)}

                    setShowList={(v) => v && setActiveView('list')}
                    setShowCarpet={(v) => v && setActiveView('carpet')}
                    setShowPuzzle={(v) => v && setActiveView('puzzle')}
                    setShowCloud={(v) => v && setActiveView('cloud')}
                    setShowSentencePuzzle={(v) => v && setActiveView('sentence')}
                    setShowSplitExercise={(v) => v && setActiveView('split')}
                    setShowStaircase={(v) => v && setActiveView('staircase')}
                    setShowTextPuzzle={(v) => v && setActiveView('textpuzzle')}
                    setShowSentenceShuffle={(v) => v && setActiveView('sentenceshuffle')}
                    setShowGapWords={() => setActiveView('gapWords')}
                    setShowGapSentences={() => setActiveView('gapSentences')}
                    setShowGapText={() => setActiveView('gapText')}
                />
            )}

            {!isViewMode ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 font-sans animate-fadeIn pb-24">
                    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl border border-slate-100 flex flex-col h-[70vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Icons.Edit2 className="text-blue-600" /> Textvorbereitung</h1>
                            <div className="flex gap-2">
                                {settings.enableCamera && (
                                    <button onClick={() => setShowScanner(true)} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all min-touch-target" title="Foto/QR scannen">
                                        <Icons.Camera size={24} />
                                    </button>
                                )}
                                <button onClick={() => setShowSettings(true)} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all min-touch-target" title="Einstellungen">
                                    <Icons.Settings size={24} />
                                </button>
                            </div>
                        </div>
                        <textarea ref={textAreaRef} className="flex-1 w-full p-6 text-xl border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none shadow-inner bg-slate-50 leading-relaxed font-medium text-slate-700 placeholder:text-slate-400" placeholder="Füge hier deinen Text ein..." value={text} onChange={(e) => handleTextChange(e.target.value)} spellCheck={false} inputMode="text"></textarea>

                        <div className="mt-6 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={() => { setText("Der kleine Fuchs läuft durch den Wald.\nEr sucht nach einer Maus.\n\nDie Sonne scheint hell am Himmel.\nDie Vögel singen ein Lied."); }} className="px-4 py-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors min-touch-target">Beispiel laden</button>
                                <label className="px-4 py-2 text-sm text-slate-500 hover:text-blue-600 font-bold cursor-pointer transition-colors flex items-center min-touch-target">
                                    Importieren <input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onload = (ev) => loadState(ev.target.result); r.readAsText(file); } }} />
                                </label>
                            </div>

                            <button
                                onClick={() => { setIsViewMode(true); }}
                                disabled={!text || text.trim().length === 0}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-touch-target"
                            >
                                <Icons.Play size={20} /> Starten
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {activeView === 'text' && (
                        <main className={`flex-1 p-4 md:p-8 outline-none print-content ${settings.lockScroll ? 'overflow-hidden touch-none' : 'overflow-y-auto custom-scroll'} pr-24 transition-all`} style={{ maxWidth: `100%` }}>
                            {/* Font Size Slider - Sticky Top Right */}
                            <div className="fixed top-4 right-28 z-40 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-4 py-3 border border-slate-200 flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">A</span>
                                <input
                                    type="range"
                                    min="16"
                                    max="80"
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                    className="w-32 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <span className="text-xl font-bold text-slate-500">A</span>
                            </div>

                            <div className="max-w-7xl mx-auto w-full transition-all duration-300" style={{ maxWidth: `${settings.textWidth}%` }}>
                                <div className={`flex flex-wrap items-baseline content-start ${settings.centerText ? 'justify-center' : 'justify-start'}`} style={{ lineHeight: settings.lineHeight, fontFamily: settings.fontFamily }}>
                                    {processedWords.map((item, idx) => {
                                        if (item.type === 'newline') {
                                            // Render a full-width break. If multiple newlines, add height.
                                            // h-4 is roughly one line height for separation
                                            return <div key={item.id} className="w-full basis-full" style={{ height: item.count > 1 ? '1.5em' : '0' }}></div>;
                                        }
                                        if (item.type === 'space') return <span key={item.id} className="select-none inline-block whitespace-pre">{item.content}</span>;
                                        if (item.type === 'text') return <span key={item.id} className="text-slate-800 break-words" style={{ fontSize: `${settings.fontSize}px` }}>{item.content}</span>;
                                        const isWordHighlighted = Array.from({ length: item.word.length }, (_, i) => item.index + i).some(idx => highlightedIndices.has(idx));

                                        return (
                                            <Word key={item.id} {...item}
                                                isHighlighted={isWordHighlighted}
                                                isHidden={hiddenIndices.has(item.id)}
                                                highlightedIndices={highlightedIndices}
                                                toggleHighlights={toggleHighlights}
                                                toggleHidden={toggleHidden}
                                                activeTool={activeTool}
                                                settings={settings}
                                                manualSyllables={item.syllables}
                                                hyphenator={hyphenator}
                                                onEditMode={(word, key, syls) => { setCorrectionData({ word, key, syllables: syls }); setShowCorrectionModal(true); }}
                                                startIndex={item.index}
                                                interactionDisabled={activeTool === 'read'}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </main>
                    )}

                    {activeView === 'gapWords' && <GapWordsView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'gapSentences' && <GapSentencesView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'gapText' && <GapTextView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}

                    {activeView === 'puzzle' && <SyllablePuzzleView words={exerciseWords} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'cloud' && <WordCloudView words={exerciseWords} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'carpet' && <SyllableCarpetView words={exerciseWords} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'list' && <WordListView words={exerciseWords} columnsState={columnsState} setColumnsState={setColumnsState} onClose={() => setActiveView('text')} settings={settings} setSettings={setSettings} onRemoveWord={() => { }} onWordUpdate={(wordId, newText) => {
                        const parts = wordId.split('_');
                        const index = parseInt(parts[parts.length - 1], 10);
                        if (isNaN(index)) return;
                        const target = processedWords.find(w => w.id === wordId);
                        if (!target) return;
                        const before = text.substring(0, index);
                        const after = text.substring(index + target.word.length);
                        handleTextChange(before + newText + after);
                    }} />}
                    {activeView === 'sentence' && <SentencePuzzleView text={text} mode="sentence" settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'textpuzzle' && <SentencePuzzleView text={text} mode="text" settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'sentenceshuffle' && <SentenceShuffleView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'staircase' && <StaircaseView words={exerciseWords.map(w => ({ ...w, isHighlighted: highlightedIndices.has(w.index) }))} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'split' && <SplitExerciseView words={exerciseWords} onClose={() => setActiveView('text')} settings={settings} />}
                    {activeView === 'gapwords' && <GapWordsView words={highlightedIndices.size > 0 ? exerciseWords : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                    {activeView === 'gapsentences' && <GapSentencesView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} />}
                </>
            )}

            {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} onExport={exportState} onImport={loadState} onPrint={handlePrint} logo={logo} setLogo={setLogo} onClearHighlights={() => setHighlightedIndices(new Set())} onShowQR={() => { setShowSettings(false); setShowQR(true); }} />}
            {showCorrectionModal && correctionData && <CorrectionModal word={correctionData.word} currentSyllables={correctionData.syllables} font={settings.fontFamily} onSave={handleCorrectionSave} onClose={() => setShowCorrectionModal(false)} />}
            {showQR && <QRCodeModal text={JSON.stringify({ text, settings, highlights: Array.from(highlightedIndices), hidden: Array.from(hiddenIndices), logo, manualCorrections, columnsState })} onClose={() => setShowQR(false)} />}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} onScanSuccess={(decodedText) => {
                setShowScanner(false);
                const trimmed = decodedText.trim();

                // FALL A: Es ist ein Link (Cloud JSON Datei)
                if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                    fetch(trimmed)
                        .then(res => res.json())
                        .then(data => {
                            loadState(JSON.stringify(data));
                        })
                        .catch(err => alert("Fehler beim Laden vom Link: " + err.message));

                    // FALL B: Es ist ein JSON-Objekt
                } else if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                    try {
                        const data = JSON.parse(trimmed);
                        if (data.text && !data.settings) {
                            // Einfaches Text-Objekt
                            setText(data.text);
                            setIsViewMode(true);
                        } else {
                            // Vollständiger State
                            loadState(trimmed);
                        }
                    } catch (e) {
                        // JSON Parse fehlgeschlagen = normaler Text
                        setText(trimmed);
                        setIsViewMode(true);
                    }

                    // FALL C: Reiner Text (Full Text QR Code)
                } else {
                    if (confirm("Gescannter Text wird eingefügt. Überschreiben?")) {
                        setText(trimmed);
                        setIsViewMode(true);
                    }
                }
            }} />}
        </div>
    );
};

export default App;
