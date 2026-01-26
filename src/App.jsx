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
import { PuzzleTestTwoSyllableView } from './components/PuzzleTestTwoSyllableView';
import { PuzzleTestMultiSyllableView } from './components/PuzzleTestMultiSyllableView';
import { SyllableCompositionView } from './components/SyllableCompositionView';
import { SyllableCompositionExtensionView } from './components/SyllableCompositionExtensionView';
import { WordCloudView } from './components/WordCloudView';
import { SyllableCarpetView } from './components/SyllableCarpetView';
import { WordListView } from './components/WordListView';
import { SentencePuzzleView } from './components/SentencePuzzleView';
import { SentenceShuffleView } from './components/SentenceShuffleView';
import { StaircaseView } from './components/StaircaseView';
import { GapWordsView } from './components/GapWordsView';
import { GapSentencesView } from './components/GapSentencesView';
import { GapTextView } from './components/GapTextView';
import { CaseExerciseView } from './components/CaseExerciseView';
import { FindLettersView } from './components/FindLettersView';
import { Toolbar } from './components/Toolbar';
import { Space } from './components/Space';
import { getCachedSyllables } from './utils/syllables';
import { compressIndices, decompressIndices, compressColors, decompressColors } from './utils/compression';
import { SpeedReadingView } from './components/SpeedReadingView';
import { WordSortingView } from './components/WordSortingView';
import { AlphabetSortingView } from './components/AlphabetSortingView';
import { ConnectionOverlay } from './components/ConnectionOverlay';

import "mobile-drag-drop/default.css";

// Initialize mobile-drag-drop polyfill
polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    holdToDrag: 100, // Short delay to prevent accidental drags during scrolls, but feel "instant"
    force: true
});



const useHypherLoader = () => {
    const [hyphenatorInstance, setHyphenatorInstance] = useState(null);
    useEffect(() => {
        // Since we import locally in Vite, we can just instantiate
        setHyphenatorInstance(new Hypher(german));
        // console.log("Hyphenator disabled for debugging");
    }, []);
    return { instance: hyphenatorInstance, loading: false };
};

const DEFAULT_SETTINGS = {
    fontSize: 48,
    lineHeight: 1.4,
    wordSpacing: 0.5,
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
    textWidth: 83,
    letterSpacing: 0.05,
    reduceMenu: false,
    clusters: ['sch', 'chs', 'ch', 'ck', 'ph', 'pf', 'th', 'qu', 'ei', 'ie', 'eu', 'au', 'äu', 'ai', 'sp', 'st'],
    imageWidth: 15
};

const App = () => {
    const [text, setText] = useState("");
    const [isViewMode, setIsViewMode] = useState(false);
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('textarbeit_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migration: Ensure robust Comic Sans Stack
                // Unify all "Comic" variations to the robust stack with Neue first
                if (parsed.fontFamily && /Comic/i.test(parsed.fontFamily)) {
                    parsed.fontFamily = "'Comic Neue', 'Comic Sans MS', cursive";
                }
                // Merge saved settings with defaults to ensure new keys are present
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load settings from localStorage', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('textarbeit_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings to localStorage', e);
        }
    }, [settings]);


    const [highlightedIndices, setHighlightedIndices] = useState(new Set());
    const [hiddenIndices, setHiddenIndices] = useState(new Set());
    const [hideYellowLetters, setHideYellowLetters] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [logo, setLogo] = useState(null);
    const [activeTool, setActiveTool] = useState(null); // 'split', 'blur'
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionData, setCorrectionData] = useState(null);
    const [manualCorrections, setManualCorrections] = useState({}); // { "Wort_Index": ["Syl","ben"] }
    const [textCorrections, setTextCorrections] = useState({}); // { "Wort_Index": "korrigierterText" }
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [columnsState, setColumnsState] = useState({ cols: {}, order: [] });
    // View States
    const [activeView, setActiveView] = useState('text'); // text, puzzle, cloud, list, carpet, sentence, split, gapWords, gapSentences, gapText
    const [sentencePuzzleState, setSentencePuzzleState] = useState(null);

    // Color Feature State
    const [wordColors, setWordColors] = useState({}); // { index: hexColor }
    const [colorPalette, setColorPalette] = useState(['#3b82f6', '#a855f7', '#ef4444', '#f97316', '#22c55e']); // Reordered for Toolbar Column Layout
    const [activeColor, setActiveColor] = useState('neutral'); // Default to neutral (grey frame)
    const [isTextMarkerMode, setIsTextMarkerMode] = useState(false);
    const [colorHeaders, setColorHeaders] = useState({}); // { "#hex": "My Title" }
    const [wordDrawings, setWordDrawings] = useState({}); // { wordIndex: [ { points: [{x,y}...], color, strokeWidth } ] }

    // WordList View Specific Persistence
    const [wordListSortByColor, setWordListSortByColor] = useState(false);
    const [wordListColumnCount, setWordListColumnCount] = useState(1);

    const textAreaRef = useRef(null);
    const activeColorRef = useRef(activeColor);
    activeColorRef.current = activeColor; // Keep ref in sync
    const { instance: hyphenator } = useHypherLoader();

    // Grouping State
    const [wordGroups, setWordGroups] = useState([]); // Array<{ ids: number[], color: string }>
    const [isGrouping, setIsGrouping] = useState(false);
    const [currentGroupSelection, setCurrentGroupSelection] = useState([]); // Array<number>
    const wordRefs = useRef({});
    const textContainerRef = useRef(null);

    // Main Window Panning Logic
    const mainScrollRef = useRef(null);
    const mainPanningRef = useRef({ isPanning: false, startY: 0, scrollTop: 0 });

    const handleMainPanMouseDown = (e) => {
        // Allow panning only if not interacting with specific tools or elements
        if (
            e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('.cursor-pointer') ||
            e.target.closest('.draggable-piece')
        ) {
            return;
        }

        // If TextMarker/Pen is active, we might want to prioritize that instead of panning?
        // But user can pan by grabbing whitespace.
        // Check if we hit a Word?
        const isWord = e.target.closest('[data-component="word"]'); // assuming Word has this, or use class check
        // Actually Word has 'cursor-pointer' usually?
        // Let's rely on cursor-pointer check above which covers most clickable things.

        mainPanningRef.current = {
            isPanning: true,
            startY: e.clientY,
            scrollTop: mainScrollRef.current ? mainScrollRef.current.scrollTop : 0
        };
        document.body.style.cursor = 'grabbing';
    };

    const handleMainPanMouseMove = (e) => {
        if (!mainPanningRef.current.isPanning || !mainScrollRef.current) return;
        e.preventDefault();
        const y = e.clientY;
        const walkY = (y - mainPanningRef.current.startY) * 1.5; // 1.5x speed
        mainScrollRef.current.scrollTop = mainPanningRef.current.scrollTop - walkY;
    };

    const handleMainPanMouseUp = () => {
        if (mainPanningRef.current.isPanning) {
            mainPanningRef.current.isPanning = false;
            document.body.style.cursor = '';
        }
    };

    // Attach Global MouseUp to catch release outside
    useEffect(() => {
        window.addEventListener('mouseup', handleMainPanMouseUp);
        return () => window.removeEventListener('mouseup', handleMainPanMouseUp);
    }, []);

    // Disable Context Menu Globally to prevent confusion (especially for children on long-press)
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    const shiftHighlights = (indices, diffStart, lengthDiff) => {
        if (indices.size === 0 || lengthDiff === 0) return indices;
        const next = new Set();
        indices.forEach(idx => {
            if (idx < diffStart) {
                next.add(idx);
            } else if (lengthDiff < 0) {
                // Deletion
                if (idx >= diffStart - lengthDiff) {
                    next.add(idx + lengthDiff);
                }
            } else {
                // Insertion
                next.add(idx + lengthDiff);
            }
        });
        return next;
    };

    // Smart Text Update that shifts highlights
    const handleTextChange = (newText) => {
        // Junk Removal (ZWSP, BOM etc) - always safe to remove while typing
        const junkRegex = /[\u200B-\u200D\uFEFF]/g;
        let diffStart = 0;
        let lengthDiff = 0;

        if (junkRegex.test(newText)) {
            // If junk found, we need to sanitize AND shift highlights immediately
            const oldText = text;
            const sanitized = newText.replace(junkRegex, '');
            lengthDiff = sanitized.length - oldText.length;

            const minLen = Math.min(oldText.length, sanitized.length);
            while (diffStart < minLen && oldText[diffStart] === sanitized[diffStart]) {
                diffStart++;
            }

            setHighlightedIndices(prev => shiftHighlights(prev, diffStart, lengthDiff));
            setText(sanitized);
            return;
        }

        const oldText = text;
        lengthDiff = newText.length - oldText.length;

        if (lengthDiff === 0) {
            setText(newText);
            return;
        }

        const minLen = Math.min(oldText.length, newText.length);
        while (diffStart < minLen && oldText[diffStart] === newText[diffStart]) {
            diffStart++;
        }

        if (highlightedIndices.size > 0) {
            setHighlightedIndices(prev => shiftHighlights(prev, diffStart, lengthDiff));
        }
        setText(newText);
    };

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
                    const newlines = segment.match(/\n/g).length;
                    return { id: `nl-${startIndex}`, type: 'newline', count: newlines, content: segment, index: startIndex };
                }
                return { id: `space-${startIndex}`, type: 'space', content: segment, index: startIndex };
            }

            // Simple logic to separate punctuation
            const match = segment.match(/^([^\w\u00C0-\u017F]*)([\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);
            if (match) {
                const prefix = match[1];
                const cleanWord = match[2];
                const suffix = match[3];
                // Word starts after prefix
                const wordStartIndex = startIndex + prefix.length;
                const key = `word_${wordStartIndex}`;
                const lookupKey = `${cleanWord}_${wordStartIndex}`;
                const syllables = manualCorrections[lookupKey] || getCachedSyllables(cleanWord, hyphenator);
                return { type: 'word', word: cleanWord, prefix, suffix, index: wordStartIndex, id: key, syllables };
            }
            return { type: 'text', content: segment, index: startIndex, id: `text_${startIndex}` };
        });
    }, [text, manualCorrections, hyphenator]);

    const wordsOnly = useMemo(() => processedWords.filter(w => w.type === 'word'), [processedWords]);
    // If words are highlighted, only use those for exercises. Otherwise use all.
    const exerciseWords = useMemo(() => {

        const hasHighlights = highlightedIndices.size > 0;
        const coloredIndices = Object.keys(wordColors);
        const hasColors = coloredIndices.length > 0;

        let result = wordsOnly;

        if (hasHighlights || hasColors) {
            result = result.filter(w => {
                // Check yellow highlights
                for (let i = 0; i < w.word.length; i++) {
                    if (highlightedIndices.has(w.index + i)) return true;
                }
                // Check color markings
                // FIX: Only include word if it is ALSO highlighted (Hand/Neutral)
                // If it is ONLY colored (Textmarker), it should be purely visual.
                // Reverted per user request? No, user requested: "Wörter, die mit Textmarker markiert sind, sollen nicht als markiert in dem Sinne gelten, dass sie Grundlage für die Übungen sind"
                // So if ONLY colored -> return false. 
                // Checks above: `result = result.filter...`
                // logic: Keep if (Yellow Highlight) OR (Color Marking AND Highlight??)

                // Correction: The Requirement is: Textmarker marks do NOT trigger inclusion.
                // So we only look at `highlightedIndices`.
                // But wait, what if I colored it AND clicked it? Then it is in `highlightedIndices`.
                // So we just REMOVE the check for `wordColors` here?

                // "Wörter, die mit Textmarker markiert sind, sollen nicht als markiert in dem Sinne gelten"
                // This implies that solely coloring them is not enough.
                // BUT current logic said: if (hasHighlights || hasColors) ...
                // So if I remov the `if (wordColors[w.index]) return true;` check, 
                // then words that are NOT in `highlightedIndices` will be dropped.
                // This is exactly what is requested.

                // if (wordColors[w.index]) return true; // REMOVED THIS LINE
                return false;
            });
        }

        return result.map(w => {
            // Apply text corrections if available
            const lookupKey = `${w.word}_${w.index}`;
            if (textCorrections[lookupKey]) {
                const newText = textCorrections[lookupKey];
                return {
                    ...w,
                    word: newText,
                    text: newText,
                    syllables: getCachedSyllables(newText, hyphenator)
                };
            }
            return w;
        });
    }, [wordsOnly, highlightedIndices, wordColors, textCorrections, hyphenator]);

    const uniqueExerciseWords = useMemo(() => {
        const unique = [];
        const seen = new Set();
        exerciseWords.forEach(w => {
            // Deduplicate based on exact word text
            if (!seen.has(w.word)) {
                seen.add(w.word);
                unique.push(w);
            }
        });
        return unique;
    }, [exerciseWords]);

    const hasMarkings = highlightedIndices.size > 0 || Object.keys(wordColors).length > 0;

    // Data Management
    const loadState = (jsonData) => {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (data.text) setText(data.text);
            if (data.settings) {
                // Merge Data Settings with Default Settings to ensure cleaner state
                // This resets any unspecified settings to their defaults
                const newSettings = { ...DEFAULT_SETTINGS };
                // Only apply provided keys
                Object.keys(data.settings).forEach(key => {
                    newSettings[key] = data.settings[key];
                });
                setSettings(newSettings);
            }


            // Robust loading with defaults for missing keys
            // Support both Array and Compressed String formats
            const rawHighlights = data.highlights || [];
            if (typeof rawHighlights === 'string') {
                setHighlightedIndices(new Set(decompressIndices(rawHighlights)));
            } else {
                setHighlightedIndices(new Set(rawHighlights));
            }

            const rawHidden = data.hidden || [];
            if (typeof rawHidden === 'string') {
                setHiddenIndices(new Set(decompressIndices(rawHidden)));
            } else {
                setHiddenIndices(new Set(rawHidden));
            }

            if (data.logo) setLogo(data.logo);
            setManualCorrections(data.manualCorrections || {});
            setTextCorrections(data.textCorrections || {});

            // Decompress columnsState: supports legacy object or new compact string "colId:title:color;..."
            const rawCols = data.columnsState;
            if (typeof rawCols === 'string') {
                const cols = {};
                const order = [];
                rawCols.split(';').filter(Boolean).forEach(part => {
                    const [key, title, color] = part.split(':');
                    if (key) {
                        cols[key] = { id: key, title: title || '', color: color || '', items: [] };
                        order.push(key);
                    }
                });
                setColumnsState({ cols, order });
                // Extract colorHeaders from columnsState
                const headers = {};
                order.forEach(key => {
                    if (cols[key].title && cols[key].color) {
                        headers[cols[key].color] = cols[key].title;
                    }
                });
                if (Object.keys(headers).length > 0) setColorHeaders(headers);
            } else {
                setColumnsState(rawCols || { cols: {}, order: [] });
                if (data.colorHeaders) setColorHeaders(data.colorHeaders);
            }

            // Auto-decompress wordColors if it's a string
            const rawColors = data.wordColors || {};
            if (typeof rawColors === 'string') {
                setWordColors(decompressColors(rawColors));
            } else {
                setWordColors(rawColors);
            }

            setWordDrawings(data.wordDrawings || {});

            // Decompress wordGroups: supports legacy array or new compact string "idx+idx:paletteIdx;..."
            const rawGroups = data.wordGroups;
            if (typeof rawGroups === 'string') {
                const groups = rawGroups.split(';').filter(Boolean).map(part => {
                    const [idsPart, colorIdx] = part.split(':');
                    const ids = idsPart.split('+').map(Number).filter(n => !isNaN(n));
                    return { ids, color: `palette-${colorIdx || 0}` };
                });
                setWordGroups(groups);
            } else {
                setWordGroups(rawGroups || []);
            }

            // Decompress colorPalette: supports legacy array or new compact string "hex,hex,..."
            const rawPalette = data.colorPalette;
            if (typeof rawPalette === 'string') {
                setColorPalette(rawPalette.split(',').map(h => `#${h}`));
            } else if (rawPalette) {
                setColorPalette(rawPalette);
            }

            if (data.wordListSortByColor !== undefined) setWordListSortByColor(data.wordListSortByColor);

            setIsViewMode(true);
        } catch (e) { alert("Fehler beim Laden der Datei."); }
    };
    const exportState = () => {
        // Build data-sparse export (same format as QR code export)
        const data = {
            text,
            // Settings: Only save differences from default
            settings: (() => {
                const diff = {};
                let hasDiff = false;
                Object.keys(settings).forEach(key => {
                    if (JSON.stringify(settings[key]) !== JSON.stringify(DEFAULT_SETTINGS[key])) {
                        diff[key] = settings[key];
                        hasDiff = true;
                    }
                });
                return hasDiff ? diff : undefined;
            })(),
            // Highlights & Hidden: Use compressed indices
            highlights: highlightedIndices.size > 0 ? compressIndices(highlightedIndices) : undefined,
            hidden: hiddenIndices.size > 0 ? compressIndices(hiddenIndices) : undefined,
            // Logo: Keep as-is (only relevant for local files)
            logo: logo || undefined,
            // Corrections: Only if present
            manualCorrections: Object.keys(manualCorrections).length > 0 ? manualCorrections : undefined,
            textCorrections: Object.keys(textCorrections).length > 0 ? textCorrections : undefined,
            // ColumnsState: Compact string format "colId:title:color;..."
            columnsState: Object.keys(columnsState.cols).length > 0 ? (() => {
                const parts = columnsState.order.map(key => {
                    const col = columnsState.cols[key];
                    const title = (col.title || '').replace(/[;:|]/g, '');
                    const color = col.color || '';
                    return `${key}:${title}:${color}`;
                });
                return parts.join(';');
            })() : undefined,
            // WordColors: Compressed format
            wordColors: Object.keys(wordColors).length > 0 ? compressColors(wordColors) : undefined,
            // ColorPalette: Only if different from default
            colorPalette: JSON.stringify(colorPalette) !== JSON.stringify(['#3b82f6', '#a855f7', '#ef4444', '#f97316', '#22c55e'])
                ? colorPalette.map(c => c.replace('#', '')).join(',')
                : undefined,
            // WordDrawings: Only if present
            wordDrawings: Object.keys(wordDrawings).length > 0 ? wordDrawings : undefined,
            // WordGroups: Compact format "idx+idx+idx:paletteIdx;..."
            wordGroups: wordGroups.length > 0
                ? wordGroups.map(g => `${g.ids.join('+')}:${g.color?.replace('palette-', '') || 0}`).join(';')
                : undefined,
            // Flags
            wordListSortByColor: wordListSortByColor ? true : undefined,
            colorHeaders: Object.keys(colorHeaders).length > 0 ? colorHeaders : undefined
        };
        // Remove undefined keys for cleaner JSON
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

        // Ask for filename
        let filename = prompt('Bitte Dateinamen eingeben:', 'textarbeit-export');
        if (filename === null) return; // Cancelled
        if (!filename.trim()) filename = 'textarbeit-export';
        if (!filename.toLowerCase().endsWith('.json')) filename += '.json';

        const blob = new Blob([JSON.stringify(cleanData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    };

    const wordColorsRef = useRef(wordColors);
    const highlightedIndicesRef = useRef(highlightedIndices);

    useEffect(() => { wordColorsRef.current = wordColors; }, [wordColors]);
    useEffect(() => { highlightedIndicesRef.current = highlightedIndices; }, [highlightedIndices]);

    // INTEGRETY CHECK: Enforce valid color state
    useEffect(() => {
        if (isTextMarkerMode && (activeColor === 'neutral' || activeColor === 'yellow')) {
            // Fix invalid state: Marker is ON but color is Neutral or Yellow (Letter mode). Force default Orange.
            setActiveColor('rgba(249, 115, 22, 0.15)');
        }
    }, [isTextMarkerMode, activeColor]);

    // Painting Logic (Textmarker)
    const isPaintActive = useRef(false);
    const lastPaintedIndex = useRef(null);
    const dragStartIndex = useRef(null); // Track where the drag started

    const handlePaint = useCallback((index) => {
        // Fix: In Pen Mode, handlePaint should ONLY run if we are Erasing (transparent).
        // If we are drawing (activeColor is set), we do not want to paint the background.
        if (!isTextMarkerMode) {
            if (activeTool !== 'pen') return;
            if (activeColor !== 'transparent') return;
        }

        // Safety Fallback: Use default orange if activeColor is somehow invalid/neutral/yellow
        const paintColor = (!activeColor || activeColor === 'neutral' || activeColor === 'yellow') ? 'rgba(249, 115, 22, 0.15)' : activeColor;
        setWordColors(prev => {
            const next = { ...prev };
            let indicesToFill = [];

            // Always fill from drag start to current position to ensure no gaps
            const startIdx = dragStartIndex.current !== null ? dragStartIndex.current : index;
            const start = Math.min(startIdx, index);
            const end = Math.max(startIdx, index);

            // Fill entire range from start to end
            for (let i = start; i <= end; i++) {
                indicesToFill.push(i);
            }

            // EXPAND indices to include full words if any part of a word is touched
            // This ensures erasing/coloring a word works completely even if we only graze it.
            const expandedIndices = new Set();
            indicesToFill.forEach(idx => {
                // Check if this index belongs to a word
                const wordItem = processedWords.find(w => {
                    if (w.type === 'word') {
                        return idx >= w.index && idx < w.index + w.word.length;
                    }
                    return w.index === idx;
                });

                if (wordItem && wordItem.type === 'word') {
                    // Add ALL indices of this word
                    for (let k = 0; k < wordItem.word.length; k++) {
                        expandedIndices.add(wordItem.index + k);
                    }
                } else {
                    expandedIndices.add(idx);
                }
            });

            // Convert back to array
            indicesToFill = Array.from(expandedIndices);

            let changed = false;
            let highlightsChanged = false;

            setHighlightedIndices(prevHighlights => {
                const nextHighlights = new Set(prevHighlights);

                indicesToFill.forEach(idx => {
                    // Toggle logic: if dragging from an empty space into a filled one, we paint.
                    // If dragging from a filled space into a filled one with same color, we stay.
                    // To "Remove", maybe we need a dedicated "Transparent" state?
                    // For now, let's keep it simple: overwrite or stay.

                    if (next[idx] !== paintColor) {
                        if (paintColor === 'transparent') {
                            delete next[idx];
                            // Also clear from highlightedIndices when erasing
                            if (nextHighlights.has(idx)) {
                                nextHighlights.delete(idx);
                                highlightsChanged = true;
                            }
                        } else {
                            // Preserve existing yellow letter markings when applying word color
                            // Only apply word color if the letter is NOT already yellow-marked
                            if (next[idx] !== 'yellow') {
                                next[idx] = paintColor;
                            }
                        }
                        changed = true;
                    }
                });

                return highlightsChanged ? nextHighlights : prevHighlights;
            });

            if (changed || highlightsChanged) {
                lastPaintedIndex.current = index;
                return next;
            }
            return prev;
        });

    }, [isTextMarkerMode, activeColor, processedWords, activeTool]);

    // Touch Logic for App.jsx - Global handlers
    // We add 'touchmove' and 'touchend' to window to handle "drag painting"
    useEffect(() => {
        const handleUp = () => {
            isPaintActive.current = false;
            lastPaintedIndex.current = null;
            dragStartIndex.current = null; // Reset drag start on mouse up
        };

        // Global mousemove listener for reliable paint/erase detection
        const handleMove = (e) => {
            if (!isPaintActive.current) return;
            if (!isTextMarkerMode && activeTool !== 'pen') return;

            // Handle both Mouse and Touch events
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
                // Prevent scrolling while painting
                if (e.cancelable) e.preventDefault();
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // Find element under cursor using elementsFromPoint
            const elements = document.elementsFromPoint(clientX, clientY);
            for (const el of elements) {
                const paintIndex = el.getAttribute('data-paint-index');
                if (paintIndex !== null) {
                    const idx = parseInt(paintIndex, 10);
                    if (!isNaN(idx)) {
                        handlePaint(idx);
                    }
                    break; // Only paint the topmost element with an index
                }
            }
        };

        window.addEventListener('mouseup', handleUp);
        window.addEventListener('mousemove', handleMove);
        // Add Touch Listeners
        window.addEventListener('touchend', handleUp);
        window.addEventListener('touchcancel', handleUp); // Handle interruptions
        // Use passive: false to allow preventDefault (stop scrolling)
        window.addEventListener('touchmove', handleMove, { passive: false });

        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchend', handleUp);
            window.removeEventListener('touchcancel', handleUp);
            window.removeEventListener('touchmove', handleMove);
        };
    }, [isTextMarkerMode, activeTool, handlePaint]);

    // Interactions
    const handleGrouping = useCallback((indicesStrOrArr) => {
        const indices = Array.isArray(indicesStrOrArr) ? indicesStrOrArr : [indicesStrOrArr];
        const sortedIndices = [...indices].sort((a, b) => a - b);

        setCurrentGroupSelection(prev => {
            const asSet = new Set(prev);
            let modified = false;
            // Toggle: Add if not present, remove if present?
            // Actually simpler: Add to selection.
            // If user clicks same word again, maybe remove?

            sortedIndices.forEach(idx => {
                if (asSet.has(idx)) { asSet.delete(idx); modified = true; }
                else { asSet.add(idx); modified = true; }
            });
            return modified ? Array.from(asSet).sort((a, b) => a - b) : prev;
        });
    }, []);

    const toggleHighlights = useCallback((indicesStrOrArr, options = {}) => {
        const indices = Array.isArray(indicesStrOrArr) ? indicesStrOrArr : [indicesStrOrArr];

        if (isGrouping) {
            // For grouping, we only care about the ANCHOR index (Start Index of the word)
            // The refs are stored by startIndex.
            // indices[0] is typically the startIndex passed from Word.jsx
            if (indices.length > 0) {
                handleGrouping(indices[0]);
            }
            return;
        }

        if (activeTool === 'read') return;

        const currentActiveColor = activeColorRef.current; // 'neutral', 'yellow', 'palette-0', or Hex Code

        // Determine if we should "Unmark" (Toggle Off)
        const currentHighlights = highlightedIndicesRef.current;
        const currentColors = wordColorsRef.current;

        const allHighlighted = indices.every(i => currentHighlights.has(i));
        const allSameColor = indices.every(i => {
            const rangeColor = currentColors[i]; // undefined, 'yellow', hex, or 'palette-X'
            if (currentActiveColor === 'neutral') return rangeColor === undefined;
            // Relaxed check: If no active color (generic mode), allow unmarking
            if (!currentActiveColor) return true;
            // Check for direct match (handles 'yellow', 'palette-X')
            return rangeColor === currentActiveColor;
        });

        // Check if word is part of a group
        // indices[0] is start index
        const isGrouped = wordGroups.some(g => g.ids.includes(indices[0]));

        // Always unmark if:
        // 1. Matches color conditions (standard toggle)
        // 2. OR is part of a group (Force detach/unmark on click)
        const shouldUnmark = (allHighlighted && allSameColor) || isGrouped;

        setHighlightedIndices(prev => {
            const next = new Set(prev);

            // Handle explicit unmarking (e.g. clearing rest of word when switching to char mode)
            if (options.unmarkIndices) {
                options.unmarkIndices.forEach(idx => next.delete(idx));
            }

            if (shouldUnmark) {
                indices.forEach(i => next.delete(i));
            } else {
                // FIX: If erasing (transparent), DO NOT ADD to highlights (prevent Gray Box)
                if (currentActiveColor !== 'transparent') {
                    indices.forEach(i => next.add(i));
                }
            }
            return next;
        });

        setWordColors(prev => {
            const next = { ...prev };

            // Handle clearing requested ranges (Exclusivity)
            if (options.clearColors) {
                options.clearColors.forEach(idx => delete next[idx]);
            }

            if (shouldUnmark) {
                indices.forEach(i => delete next[i]);

                // ALSO REMOVE FROM GROUPS IF PRESENT
                // We need the start index of the word.
                // Assuming indices contains contiguous indices of a word.
                if (indices.length > 0) {
                    const startIndex = Math.min(...indices);
                    setWordGroups(prevGroups => {
                        const newGroups = prevGroups.map(g => {
                            if (g.ids.includes(startIndex)) {
                                // Remove this ID
                                return { ...g, ids: g.ids.filter(id => id !== startIndex) };
                            }
                            return g;
                        });
                        // Filter out groups that have < 2 items? 
                        // User request: "wird dessen Markierung und die Verbindung entfernt"
                        // If a group has 1 item left, it's just a colored word without connection? 
                        // Or should we keep it as a "group of 1" which might have special styling?
                        // Usually groups are connections. A single item group is useless.
                        // But maybe we keep it as is.
                        // But if I remove the word from 'ids', it is no longer in the group.
                        return newGroups.filter(g => g.ids.length > 0);
                    });
                }
            } else {
                // Apply new color
                indices.forEach(i => {
                    if (currentActiveColor === 'neutral') {
                        delete next[i];
                    } else if (currentActiveColor) {
                        // Preserve existing yellow letter markings when applying word color
                        // Only apply the new color if the letter is NOT already yellow-marked
                        if (next[i] !== 'yellow') {
                            next[i] = currentActiveColor;
                        }
                    }
                });
            }
            return next;
        });
    }, [isGrouping, handleGrouping, activeTool, wordGroups]);
    const toggleHidden = useCallback((key) => {
        setHiddenIndices(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    }, []);

    const handleUpdateDrawings = useCallback((wordIndex, newDrawings) => {
        setWordDrawings(prev => ({
            ...prev,
            [wordIndex]: newDrawings
        }));
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


    const handleBatchHide = useCallback(() => {
        const markedWordIds = processedWords
            .filter(w => {
                if (w.type !== 'word') return false;
                const wordChars = Array.from({ length: w.word.length }, (_, i) => w.index + i);
                const hasHighlight = wordChars.some(idx => highlightedIndices.has(idx));
                const hasColor = wordColors[w.index] !== undefined;
                return hasHighlight || hasColor;
            })
            .map(w => w.id);

        if (markedWordIds.length === 0) return;

        // Check if all marked words are currently hidden
        const allHidden = markedWordIds.every(id => hiddenIndices.has(id));

        setHiddenIndices(prev => {
            const next = new Set(prev);
            if (allHidden) {
                // If all are hidden -> Show all (Unhide)
                markedWordIds.forEach(id => next.delete(id));
            } else {
                // If not all are hidden -> Hide all
                markedWordIds.forEach(id => next.add(id));
            }
            return next;
        });
    }, [processedWords, highlightedIndices, wordColors, hiddenIndices]);

    const handleToggleHideLetters = useCallback(() => {
        setHideYellowLetters(prev => !prev);
    }, []);


    const handleMarkAllNeutral = useCallback(() => {
        const allIndices = new Set();
        processedWords.forEach(w => {
            if (w.type === 'word') {
                for (let i = 0; i < w.word.length; i++) {
                    allIndices.add(w.index + i);
                }
            }
        });
        setHighlightedIndices(allIndices);
        setWordColors({});
    }, [processedWords]);

    const handleResetSettings = () => {
        if (window.confirm('Möchten Sie alle Einstellungen wirklich auf den Standard zurücksetzen?')) {
            setSettings(DEFAULT_SETTINGS);
            localStorage.removeItem('textarbeit_settings');
        }
    };

    // Handle Printing
    const handlePrint = (type, options = {}) => {
        const style = document.createElement('style');
        const orientation = options.orientation || 'auto';
        const landscapeRule = `@page { size: ${orientation}; margin: 0.5cm; }`;
        style.innerHTML = `
            ${landscapeRule}
            @media print {
                nav, button:not(.print-visible), .no-print { display: none !important; }
                body { padding: 0 !important; margin: 0 !important; background: white !important; }
                .print-content { display: block !important; position: relative !important; inset: 0 !important; }
                .bg-slate-100, .bg-slate-50, .bg-gradient-to-br, .bg-indigo-50, .bg-purple-50 { background: white !important; }
            }
        `;
        document.head.appendChild(style);

        if (type === 'text') {
            window.print();
            document.head.removeChild(style);
        } else {
            setActiveView(type);
            setTimeout(() => {
                window.print();
                setActiveView('text');
                document.head.removeChild(style);
            }, 500);
        }
    };

    // Fullscreen
    const toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { if (document.exitFullscreen) document.exitFullscreen(); } };





    const sanitizeText = (input) => {
        if (!input) return input;
        return input
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove ZWSP, BOM, etc.
            .replace(/\u00A0/g, ' ')               // Replace NBSP with space
            .replace(/^[ \t]+$/gm, '');            // Remove spaces from empty lines
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const cleanPaste = sanitizeText(pastedText);

        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = text;

        const newText = currentText.substring(0, start) + cleanPaste + currentText.substring(end);
        const lengthDiff = newText.length - currentText.length;

        // Shift highlights correctly for the paste action
        if (highlightedIndices.size > 0) {
            setHighlightedIndices(prev => shiftHighlights(prev, start, lengthDiff));
        }

        setText(newText);

        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + cleanPaste.length;
            }
        }, 0);
    };

    // Also sanitize on blur to catch anything else
    const handleBlur = () => {
        setText(prev => {
            const sanitized = sanitizeText(prev);
            if (sanitized === prev) return prev;

            // If sanitization changed length, we ideally should shift highlights,
            // but blur-sanitization usually happens at "random" spots (empty lines).
            // A simple exhaustive diff is safer here if length changed.
            const lengthDiff = sanitized.length - prev.length;
            if (lengthDiff !== 0) {
                // Find where it changed
                let diffStart = 0;
                const minLen = Math.min(prev.length, sanitized.length);
                while (diffStart < minLen && prev[diffStart] === sanitized[diffStart]) {
                    diffStart++;
                }
                setHighlightedIndices(h => shiftHighlights(h, diffStart, lengthDiff));
            }
            return sanitized;
        });
    };

    const handleFullClear = () => {
        if (window.confirm('Möchten Sie den Text und alle Markierungen wirklich löschen?')) {
            setText('');
            setHighlightedIndices(new Set());
            setWordColors({});
            setWordGroups([]);
            setHiddenIndices(new Set());
            setWordDrawings({});
            setManualCorrections({});
            setTextCorrections({});
            setColumnsState({ cols: {}, order: [] });
            setCurrentGroupSelection([]);
            setIsTextMarkerMode(false);
            setActiveTool(null);
        }
    };

    return (
        <div className={`h-screen overflow-hidden flex flex-col bg-slate-50 transition-colors duration-500`}>

            {isViewMode && (
                <Toolbar
                    isViewMode={isViewMode}
                    isReadingMode={activeTool === 'read'}
                    activeTool={activeTool}
                    isFullscreen={!!document.fullscreenElement}
                    text={text}
                    enableCamera={settings.enableCamera}
                    isLoading={false}

                    // Color Props
                    colorPalette={colorPalette}
                    activeColor={activeColor}
                    onSetActiveColor={(newColor) => {
                        setActiveColor(newColor);
                    }}
                    isTextMarkerMode={isTextMarkerMode}
                    setIsTextMarkerMode={(val) => {
                        // Direct setter if needed, but we use onToggle generally
                        setIsTextMarkerMode(val);
                    }}
                    onToggleTextMarkerMode={() => {
                        const next = !isTextMarkerMode;
                        if (next) {
                            // Activating Textmarker: Deactivate Hand tool, set initial light orange color
                            // FIX: Enforce mutual exclusivity with Grouping
                            setIsGrouping(false);
                            setCurrentGroupSelection([]);

                            setActiveTool(null);
                            setIsTextMarkerMode(true);
                            setActiveColor('rgba(249, 115, 22, 0.15)'); // Light Orange Default
                        } else {
                            // Deactivating Textmarker: Return to Hand tool and Neutral marking mode
                            setIsTextMarkerMode(false);
                            setActiveTool(null);
                            setActiveColor('neutral');
                        }
                    }}
                    isGrouping={isGrouping}
                    onToggleGrouping={() => {
                        if (isGrouping) {
                            // Finish Grouping
                            if (currentGroupSelection.length > 1) {
                                // Save Group
                                const newGroup = { ids: [...currentGroupSelection].sort((a, b) => a - b), color: activeColor || '#3b82f6' };
                                setWordGroups(prev => [...prev, newGroup]);

                                // ALSO APPLY COLOR TO WORDS
                                if (activeColor) {
                                    setHighlightedIndices(prev => {
                                        const next = new Set(prev);
                                        currentGroupSelection.forEach(idx => {
                                            // We need to mark ALL indices of the word? 
                                            // The word object has a length. 'idx' is just the start index.
                                            // We need to find the word to know its length.
                                            // But wait, toggleHighlights usually handles this.
                                            // Here we only have start indices.
                                            // processedWords has the data. 
                                            // We can find the word by index.
                                            const wordObj = processedWords.find(w => w.index === idx);
                                            if (wordObj && wordObj.word) {
                                                for (let i = 0; i < wordObj.word.length; i++) next.add(idx + i);
                                            }
                                        });
                                        return next;
                                    });
                                    setWordColors(prev => {
                                        const next = { ...prev };
                                        currentGroupSelection.forEach(idx => {
                                            if (activeColor === 'neutral') {
                                                delete next[idx];
                                            } else {
                                                next[idx] = activeColor;
                                            }
                                        });
                                        return next;
                                    });
                                }
                            }
                            setCurrentGroupSelection([]);
                            setIsGrouping(false);
                        } else {
                            if (!activeColor) return;
                            // FIX: Enforce mutual exclusivity with Marker and Pen
                            setIsTextMarkerMode(false);
                            setActiveTool(null);
                            setIsGrouping(true);
                        }
                    }}
                    onUpdatePalette={(index, newColor) => setColorPalette(prev => {
                        const next = [...prev];
                        next[index] = newColor;
                        return next;
                    })}
                    settings={settings}

                    onToggleView={() => {
                        if (isViewMode) {
                            setIsViewMode(false);
                            setActiveTool(null);
                            setActiveView('text');
                        } else {
                            setIsViewMode(true);
                        }
                    }}
                    onResetHighlights={() => {
                        setHighlightedIndices(new Set());
                        setWordColors({});
                        setWordGroups([]); // FIX: Clear Groups too
                        setColumnsState({ cols: {}, order: [] }); // FIX: Clear Table as well
                        setIsTextMarkerMode(false);
                        setActiveTool(null); // FIX: Do not switch to 'read' mode, go to Hand mode
                        setActiveColor('neutral');
                    }}
                    onMarkAllNeutral={handleMarkAllNeutral}
                    onToggleReadingMode={() => {
                        const nextTool = activeTool === 'read' ? null : 'read';
                        setActiveTool(nextTool);
                        if (nextTool === 'read') {
                            setIsTextMarkerMode(false);
                            setActiveColor('neutral');
                        }
                    }}
                    onToggleFullscreen={toggleFullscreen}
                    onToolChange={(tool) => {
                        // FIX: Enforce mutual exclusivity when activating Pen
                        if (tool === 'pen') {
                            setIsTextMarkerMode(false);
                            setIsGrouping(false);
                            setCurrentGroupSelection([]);
                        }
                        setActiveTool(tool);
                    }}
                    onBatchHide={handleBatchHide}
                    hideYellowLetters={hideYellowLetters}
                    onToggleHideLetters={handleToggleHideLetters}
                    onOpenSettings={() => setShowSettings(true)}
                    onClearText={() => { if (window.confirm('Text wirklich löschen?')) setText(''); }}
                    onOpenScanner={() => setShowScanner(true)}

                    setShowList={(v) => v && setActiveView('list')}
                    setShowCarpet={(v) => v && setActiveView('carpet')}
                    setShowStaircase={(v) => v && setActiveView('staircase')}
                    setShowTextPuzzle={(v) => v && setActiveView('textpuzzle')}
                    setShowSentenceShuffle={(v) => v && setActiveView('sentenceshuffle')}
                    setShowGapWords={() => setActiveView('gapWords')}
                    setShowInitialSound={() => setActiveView('initialSound')}
                    setShowGapSentences={() => setActiveView('gapSentences')}
                    setShowGapText={() => setActiveView('gapText')}
                    setShowCaseExercise={() => setActiveView('caseExercise')}
                    setShowFindLetters={() => setActiveView('find_letters')}
                    setShowSpeedReading={() => setActiveView('speed_reading')}
                    setShowWordSorting={() => setActiveView('wordSorting')}
                    setShowAlphabetSorting={() => setActiveView('alphabetSorting')}
                    setShowPuzzleTestTwo={(v) => v && setActiveView('puzzletest_two')}
                    setShowPuzzleTestMulti={(v) => v && setActiveView('puzzletest_multi')}
                    setShowSyllableComposition={(v) => v && setActiveView('syllable_composition')}
                    setShowSyllableExtension={(v) => v && setActiveView('syllable_composition_extension')}
                    setShowCloud={(v) => v && setActiveView('cloud')}
                    setShowSentencePuzzle={(v) => v && setActiveView('sentence')}
                    setShowSplitExercise={(v) => v && setActiveView('split')}
                />
            )}

            {!isViewMode ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 font-sans animate-fadeIn pb-24">
                    <div className="bg-white pt-3 px-8 pb-8 rounded-3xl shadow-xl w-full max-w-4xl border border-slate-100 flex flex-col h-[70vh]">
                        <div className="flex justify-between items-center mb-0">
                            <div className="flex items-center">
                                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="KONTEXT Logo" className="h-11 w-auto object-contain -ml-4 -mt-[10px]" />
                            </div>
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
                        <textarea
                            ref={textAreaRef}
                            className="flex-1 w-full p-6 text-xl border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none shadow-inner bg-slate-50 leading-relaxed font-medium text-slate-700 placeholder:text-slate-400 custom-scroll"
                            placeholder="Füge hier deinen Text ein..."
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            onPaste={handlePaste}
                            onBlur={handleBlur}
                            spellCheck={true}
                            lang="de"
                            inputMode="text"
                        ></textarea>

                        <div className="mt-6 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={() => { setText("Der kleine Fuchs läuft durch den Wald.\nEr sucht nach einer Maus.\n\nDie Sonne scheint hell am Himmel.\nDie Vögel singen ein Lied."); }} className="px-4 py-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors min-touch-target">Beispiel laden</button>
                                <label className="px-4 py-2 text-sm text-slate-500 hover:text-blue-600 font-bold cursor-pointer transition-colors flex items-center min-touch-target">
                                    Datei öffnen <input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onload = (ev) => loadState(ev.target.result); r.readAsText(file); } }} />
                                </label>
                                <button onClick={handleFullClear} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all min-touch-target" title="Alles löschen">
                                    <Icons.Trash2 size={20} />
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    // Parse Text for # markings
                                    // We need to do this carefully to maintain indices or just re-process.
                                    // Easiest is to split by words, check for #, reconstruct text without #, and record indices.

                                    // Regex to find words starting with #. 
                                    // We want to remove the # but keep the word.

                                    // Create a temporary version of processed words logic to identify # locations
                                    let currentText = text;
                                    let match;
                                    const regex = /#([\w\u00C0-\u017F]+)/g; // Match #Word
                                    const newHighlights = new Set(highlightedIndices);
                                    let cleanedText = "";
                                    let lastIndex = 0;
                                    let offset = 0; // Tracks how many chars we removed (#)

                                    // Simple approach: Replace in string and track position
                                    // But indices need to be exact.
                                    // Let's iterate through the text, building a new text and a list of highlighted characters.

                                    // Actually, we can just replace # globally and map the "original index" to "new index".
                                    // But we need to know WHICH words were marked.

                                    if (currentText.includes('#')) {
                                        let loopIndex = 0;
                                        let buildText = "";
                                        const segments = currentText.split(/([#]?[\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)/);
                                        // This split might be too complex to get right with all punctuation.

                                        // Alternative: Use a regex loop
                                        const parts = [];
                                        let finalString = "";

                                        // We will rebuild the text.
                                        let ptr = 0;
                                        const fullRegex = /#?[\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*/g;

                                        // We need to preserve whitespace/punctuation between matches
                                        cleanedText = currentText.replace(/#([\w\u00C0-\u017F]+)/g, (match, word, offset) => {
                                            // This callback doesn't help with global index calculation easily because multiple replaces shift it.
                                            return word;
                                        });

                                        // Let's do a 2-pass: 
                                        // 1. Reconstruct text without #
                                        // 2. Find the words again? No, that risks finding duplicates in wrong places.

                                        // Single pass through the string
                                        let outputText = "";
                                        let outputIndex = 0;
                                        let originalIndex = 0;

                                        for (let i = 0; i < currentText.length; i++) {
                                            if (currentText[i] === '#' && (i === 0 || /[\s\P{L}]/u.test(currentText[i - 1]))) {
                                                // Check if it's followed by a word char
                                                if (i + 1 < currentText.length && /[\w\u00C0-\u017F]/.test(currentText[i + 1])) {
                                                    // It is a marker! Skip it.
                                                    // The NEXT characters (the word) should be highlighted.
                                                    originalIndex++; // Skip #

                                                    // Consume the word and mark it
                                                    let wordEnd = i + 1;
                                                    while (wordEnd < currentText.length && /[\w\u00C0-\u017F\-]/.test(currentText[wordEnd])) {
                                                        wordEnd++;
                                                    }

                                                    const wordLen = wordEnd - (i + 1);
                                                    for (let k = 0; k < wordLen; k++) {
                                                        newHighlights.add(outputIndex + k);
                                                    }
                                                    // We don't advance i here, we just skipped #. 
                                                    // The loop will continue at i+1 which is the start of the word.
                                                    continue;
                                                }
                                            }
                                            outputText += currentText[i];
                                            outputIndex++;
                                            originalIndex++;
                                        }

                                        setText(outputText);
                                        setHighlightedIndices(newHighlights);
                                    }

                                    setIsViewMode(true);
                                }}
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
                        <main
                            ref={mainScrollRef}
                            onMouseDown={handleMainPanMouseDown}
                            onMouseMove={handleMainPanMouseMove}
                            className={`flex-1 pt-20 pb-4 md:pt-24 md:pb-8 px-4 md:px-8 outline-none print-content ${settings.lockScroll ? 'overflow-hidden touch-none' : 'overflow-y-auto no-scrollbar'} pr-24 transition-all`}
                            style={{ maxWidth: `100%` }}
                        >
                            {/* Font Size Slider - Sticky Top Right */}
                            <div className="fixed top-2 right-28 z-40 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-4 h-10 border border-slate-200 flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">A</span>
                                <input
                                    type="range"
                                    min="16"
                                    max="96"
                                    step="2"
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                    className="w-32 md:w-48 accent-blue-600 rounded-lg cursor-pointer"
                                />
                                <span className="text-xl font-bold text-slate-500">A</span>
                            </div>

                            <div ref={textContainerRef} className={`mx-auto w-full transition-all duration-300 relative ${isTextMarkerMode ? 'cursor-text' : ''}`} style={{ maxWidth: `${settings.textWidth}%`, paddingRight: '5%' }}>

                                {logo && (
                                    <img
                                        src={logo}
                                        alt="Eigenes Bild"
                                        style={{
                                            width: `${settings.imageWidth || 15}vw`,
                                            maxHeight: '40vh',
                                            float: 'left',
                                            marginRight: '4rem',
                                            marginBottom: '1rem',
                                            clear: 'left'
                                        }}
                                        className="object-contain rounded-xl shadow-sm"
                                    />
                                )}

                                {/* Connection Overlay */}
                                <ConnectionOverlay
                                    groups={wordGroups}
                                    wordRefs={wordRefs}
                                    containerRef={textContainerRef}
                                    currentSelection={[...currentGroupSelection].sort((a, b) => a - b)}
                                />
                                <div className={`block ${settings.centerText ? 'text-center' : 'text-left'}`} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}>
                                    {processedWords.map((item, idx) => {
                                        if (item.type === 'newline') {
                                            // Scale height with number of newlines. count 1 = just a jump, count 2 = one empty line, etc.
                                            // In block layout, we remove flex classes and use a simple block.
                                            const newlineHeight = item.count > 1 ? (item.count - 1) * settings.lineHeight * 1.0 : 0;
                                            return <div key={item.id} style={{ height: `${newlineHeight}em`, width: '100%' }}></div>;
                                        }
                                        if (item.type === 'space') {
                                            return <Space key={item.id} {...item} isTextMarkerMode={isTextMarkerMode || activeTool === 'pen'} isReadingMode={activeTool === 'read'} color={wordColors[item.index]} colorPalette={colorPalette} wordSpacing={settings.wordSpacing} letterSpacing={settings.letterSpacing} fontSize={settings.fontSize} lineHeight={settings.lineHeight || 1.4} onMouseDown={(idx) => { isPaintActive.current = true; dragStartIndex.current = idx; lastPaintedIndex.current = idx; }} onMouseEnter={(idx, e) => { if (isPaintActive.current || (e && e.buttons === 1)) handlePaint(idx); }} />;
                                        }
                                        if (item.type === 'text') return <span key={item.id} className="text-slate-800 break-words" style={{ fontSize: `${settings.fontSize}px` }}>{item.content}</span>;
                                        const isWordHighlighted = Array.from({ length: item.word.length }, (_, i) => item.index + i).some(idx => highlightedIndices.has(idx));

                                        // Highlight Gap Fix: Check if next item is a colored space
                                        const nextItem = processedWords[idx + 1];
                                        const nextSpaceColor = (nextItem && nextItem.type === 'space') ? wordColors[nextItem.index] : null;
                                        // Resolve color to ensure it's not transparent/invalid
                                        const isNextSpaceColored = nextSpaceColor && nextSpaceColor !== 'transparent';

                                        return (
                                            <Word key={item.id} {...item}
                                                isHighlighted={isWordHighlighted}
                                                isTextMarkerMode={isTextMarkerMode || activeTool === 'pen'}
                                                forceNoMargin={isNextSpaceColored}
                                                // Grouping Styling
                                                isGrouped={wordGroups.some(g => g.ids.includes(item.index))}
                                                isSelection={currentGroupSelection.includes(item.index)}
                                                //
                                                isHidden={hiddenIndices.has(item.id)}
                                                highlightedIndices={highlightedIndices}
                                                toggleHighlights={toggleHighlights}
                                                toggleHidden={toggleHidden}
                                                hideYellowLetters={hideYellowLetters}
                                                activeTool={activeTool}
                                                activeColor={activeColor}
                                                settings={settings}
                                                manualSyllables={item.syllables}
                                                hyphenator={hyphenator}
                                                onMouseDown={(idx) => { isPaintActive.current = true; dragStartIndex.current = idx; lastPaintedIndex.current = idx; }}
                                                onTouchStart={(idx, e) => {
                                                    // Initiate painting for Touch devices
                                                    if (isTextMarkerMode || activeTool === 'pen') {
                                                        // Prevent default to stop scrolling/selection immediately
                                                        if (e.cancelable) e.preventDefault();
                                                        isPaintActive.current = true;
                                                        dragStartIndex.current = idx;
                                                        lastPaintedIndex.current = idx;
                                                        // We might want to paint immediately on start too
                                                        handlePaint(idx);
                                                    }
                                                }}
                                                onMouseEnter={(idx, e) => { if (isPaintActive.current || (e && e.buttons === 1)) handlePaint(idx); }}
                                                onEditMode={(word, key, syls) => { setCorrectionData({ word, key, syllables: syls }); setShowCorrectionModal(true); }}
                                                startIndex={item.index}
                                                isReadingMode={activeTool === 'read'}
                                                interactionDisabled={activeTool === 'read'}
                                                wordColors={wordColors}
                                                colorPalette={colorPalette}
                                                domRef={(idx, node) => {
                                                    if (node) wordRefs.current[idx] = node;
                                                    else delete wordRefs.current[idx];
                                                }}
                                                drawings={wordDrawings[item.index] || []}
                                                onUpdateDrawings={handleUpdateDrawings}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </main>
                    )}



                    {activeView === 'puzzletest_two' && <PuzzleTestTwoSyllableView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} onClose={() => setActiveView('text')} title="Silbenpuzzle 1" activeColor={activeColor} />}
                    {activeView === 'syllable_composition' && <SyllableCompositionView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} onClose={() => setActiveView('text')} title="Silbenbau 1" activeColor={activeColor} />}
                    {activeView === 'syllable_composition_extension' && <SyllableCompositionExtensionView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} onClose={() => setActiveView('text')} title="Silbenbau 2" activeColor={activeColor} />}
                    {activeView === 'puzzletest_multi' && <PuzzleTestMultiSyllableView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} onClose={() => setActiveView('text')} title="Silbenpuzzle 2" activeColor={activeColor} />}
                    {activeView === 'cloud' && <WordCloudView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Wortwolke" />}
                    {activeView === 'carpet' && <SyllableCarpetView words={hasMarkings ? exerciseWords : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Silbenteppich" />}
                    {activeView === 'speed_reading' && <SpeedReadingView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Blitzlesen" />}
                    {activeView === 'wordSorting' && <WordSortingView columnsState={columnsState} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Wörter sortieren" wordColors={wordColors} colorPalette={colorPalette} textCorrections={textCorrections} />}
                    {activeView === 'alphabetSorting' && <AlphabetSortingView words={hasMarkings ? uniqueExerciseWords : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Alphabetisch sortieren" />}
                    {activeView === 'list' && <WordListView
                        words={exerciseWords}
                        columnsState={columnsState}
                        setColumnsState={setColumnsState}
                        onClose={() => setActiveView('text')}
                        settings={settings}
                        setSettings={setSettings}
                        updateTimestamp={Object.keys(textCorrections).length + Object.values(textCorrections).join('').length} // Hash-like dependency
                        wordColors={wordColors}
                        colorPalette={colorPalette}
                        colorHeaders={colorHeaders}
                        setColorHeaders={setColorHeaders}
                        groups={wordGroups}
                        onRemoveWord={(id) => {
                            if (typeof id === 'string' && id.startsWith('group-')) {
                                // REMOVE GROUP
                                const idsString = id.replace('group-', '');
                                const ids = idsString.split('-').map(Number);

                                // 1. Remove from Groups
                                setWordGroups(prev => prev.filter(g => {
                                    if (g.ids.length !== ids.length) return true;
                                    return !g.ids.every((val, index) => val === ids[index]);
                                }));

                                // 2. Remove Colors & Highlights for ALL members
                                setHighlightedIndices(prev => {
                                    const next = new Set(prev);
                                    ids.forEach(startIndex => {
                                        const w = processedWords.find(pw => pw.index === startIndex);
                                        if (w) {
                                            for (let i = 0; i < w.word.length; i++) next.delete(startIndex + i);
                                        }
                                    });
                                    return next;
                                });
                                setWordColors(prev => {
                                    const next = { ...prev };
                                    ids.forEach(idx => delete next[idx]);
                                    return next;
                                });

                            } else {
                                // REMOVE SINGLE WORD
                                const target = processedWords.find(w => w.id === id);
                                if (target) {
                                    setHighlightedIndices(prev => {
                                        const next = new Set(prev);
                                        for (let i = 0; i < target.word.length; i++) next.delete(target.index + i);
                                        return next;
                                    });
                                    setWordColors(prev => {
                                        const next = { ...prev };
                                        delete next[target.index];
                                        return next;
                                    });
                                }
                            }
                        }}
                        title="Tabelle"
                        sortByColor={wordListSortByColor}
                        setSortByColor={setWordListSortByColor}
                        columnCount={wordListColumnCount}
                        setColumnCount={setWordListColumnCount}
                        // New Props for UI Enhancements
                        activeColor={activeColor}
                        isTextMarkerMode={isTextMarkerMode}
                        onToggleLetterMarker={() => {
                            if (activeColor === 'yellow' && !isTextMarkerMode) {
                                setActiveColor('neutral');
                            } else {
                                setActiveColor('yellow');
                                setIsTextMarkerMode(false);
                                if (activeTool === 'pen') setActiveTool(null);
                            }
                        }}
                        toggleHighlights={toggleHighlights}
                        highlightedIndices={highlightedIndices}
                        onWordUpdate={(wordId, newText) => {
                            const index = parseInt(wordId.replace('word_', ''), 10);
                            if (isNaN(index)) return;
                            const target = processedWords.find(w => w.index === index);
                            if (!target) return;

                            const lookupKey = `${target.word}_${target.index}`;
                            setTextCorrections(prev => ({ ...prev, [lookupKey]: newText }));
                        }}
                        onUpdateWordColor={(index, color) => {
                            setWordColors(prev => {
                                const next = { ...prev };
                                if (!color) delete next[index];
                                else next[index] = color;
                                return next;
                            });
                            // Also ensure the word is highlighted if it wasn't
                            setHighlightedIndices(prev => {
                                const next = new Set(prev);
                                const target = processedWords.find(w => w.index === index);
                                if (target) {
                                    for (let i = 0; i < target.word.length; i++) next.add(index + i);
                                }
                                return next;
                            });
                        }}
                    />}
                    {activeView === 'sentence' && <SentencePuzzleView text={text} mode="sentence" settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Satzpuzzle" hyphenator={hyphenator} />}
                    {activeView === 'textpuzzle' && <SentencePuzzleView text={text} mode="text" settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Textpuzzle" hyphenator={hyphenator} />}
                    {activeView === 'sentenceshuffle' && <SentenceShuffleView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Schüttelsätze" hyphenator={hyphenator} />}
                    {activeView === 'staircase' && <StaircaseView words={hasMarkings ? uniqueExerciseWords.map(w => ({ ...w, isHighlighted: highlightedIndices.has(w.index) })) : []} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Treppenwörter" />}
                    {activeView === 'split' && <SplitExerciseView words={hasMarkings ? uniqueExerciseWords : []} onClose={() => setActiveView('text')} settings={settings} setSettings={setSettings} title="Wörter trennen" />}
                    {activeView === 'gapWords' && <GapWordsView words={hasMarkings ? uniqueExerciseWords : []} highlightedIndices={highlightedIndices} wordColors={wordColors} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Lückenwörter" />}
                    {activeView === 'initialSound' && <GapWordsView words={hasMarkings ? uniqueExerciseWords : []} highlightedIndices={highlightedIndices} wordColors={wordColors} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} isInitialSound={true} title="Anfangsbuchstaben finden" />}
                    {activeView === 'gapSentences' && <GapSentencesView text={text} highlightedIndices={highlightedIndices} wordColors={wordColors} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Lückensätze" hyphenator={hyphenator} />}
                    {activeView === 'gapText' && <GapTextView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Lückentext" hyphenator={hyphenator} />}
                    {activeView === 'caseExercise' && <CaseExerciseView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Groß-/Kleinschreibung" />}
                    {activeView === 'find_letters' && <FindLettersView text={text} settings={settings} setSettings={setSettings} onClose={() => setActiveView('text')} title="Buchstaben finden" />}
                </>
            )}

            {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} onExport={exportState} onImport={loadState} onPrint={handlePrint} logo={logo} setLogo={setLogo} onClearHighlights={() => { setHighlightedIndices(new Set()); setWordColors({}); }} onShowQR={() => {
                if (!text || text.trim().length === 0) {
                    alert("Kein Text vorhanden");
                    return;
                }
                setShowSettings(false);
                setShowQR(true);
            }} onReset={handleResetSettings} activeView={activeView} />}
            {showCorrectionModal && correctionData && <CorrectionModal word={correctionData.word} currentSyllables={correctionData.syllables} font={settings.fontFamily} onSave={handleCorrectionSave} onClose={() => setShowCorrectionModal(false)} />}
            {showQR && <QRCodeModal text={JSON.stringify({
                text,
                settings: (() => {
                    const diff = {};
                    let hasDiff = false;
                    Object.keys(settings).forEach(key => {
                        const val = settings[key];
                        // Compare with default
                        if (JSON.stringify(val) !== JSON.stringify(DEFAULT_SETTINGS[key])) {
                            diff[key] = val;
                            hasDiff = true;
                        }
                    });
                    return hasDiff ? diff : undefined;
                })(),

                highlights: highlightedIndices.size > 0 ? compressIndices(highlightedIndices) : undefined,
                hidden: hiddenIndices.size > 0 ? compressIndices(hiddenIndices) : undefined,
                manualCorrections: Object.keys(manualCorrections).length > 0 ? manualCorrections : undefined,
                textCorrections: Object.keys(textCorrections).length > 0 ? textCorrections : undefined,
                // Compact columnsState: "colId:title:color;..." (items derived from wordColors)
                columnsState: Object.keys(columnsState.cols).length > 0 ? (() => {
                    // If sorting by color, only store column order and titles
                    const parts = columnsState.order.map(key => {
                        const col = columnsState.cols[key];
                        const title = (col.title || '').replace(/[;:|]/g, ''); // Sanitize delimiters
                        const color = col.color || '';
                        return `${key}:${title}:${color}`;
                    });
                    return parts.join(';');
                })() : undefined,
                wordColors: Object.keys(wordColors).length > 0 ? compressColors(wordColors) : undefined,
                // Compact colorPalette: "hex,hex,..." without #
                colorPalette: JSON.stringify(colorPalette) !== JSON.stringify(['#3b82f6', '#a855f7', '#ef4444', '#f97316', '#22c55e'])
                    ? colorPalette.map(c => c.replace('#', '')).join(',')
                    : undefined,
                // Compact wordGroups: "idx+idx+idx:paletteIdx;..."
                wordGroups: wordGroups.length > 0
                    ? wordGroups.map(g => `${g.ids.join('+')}:${g.color?.replace('palette-', '') || 0}`).join(';')
                    : undefined,
                wordListSortByColor: wordListSortByColor ? true : undefined,
                // colorHeaders integrated into columnsState above
            })} onClose={() => setShowQR(false)} />}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} onScanSuccess={(decodedText) => {
                setShowScanner(false);
                const trimmed = decodedText.trim();

                const applyImport = (newText, successMessage = null) => {
                    setText(newText);
                    setIsViewMode(true); // Direkt zur Ansicht wechseln
                    if (successMessage) {
                        // Optional: Toast/Notification logic if available, currently just silent success
                    }
                };

                const confirmIfNeeded = (action) => {
                    if (!text || text.trim().length === 0) {
                        action();
                    } else {
                        if (confirm("Vorhandenen Text ersetzen?")) {
                            action();
                        }
                    }
                };

                // FALL A: Es ist ein Link (Cloud JSON Datei)
                if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                    confirmIfNeeded(() => {
                        fetch(trimmed)
                            .then(res => res.json())
                            .then(data => {
                                loadState(JSON.stringify(data));
                            })
                            .catch(err => alert("Fehler beim Laden vom Link: " + err.message));
                    });

                    // FALL B: Es ist ein JSON-Objekt
                } else {
                    try {
                        const data = JSON.parse(trimmed);

                        if (data && typeof data === 'object') {
                            if (data.text && !data.settings && Object.keys(data).length <= 2) {
                                // Einfaches { text: "..." } Objekt
                                confirmIfNeeded(() => applyImport(data.text));
                            } else if (data.text || data.settings) {
                                // Vollständiger State
                                confirmIfNeeded(() => loadState(trimmed));
                            } else {
                                throw new Error("Unbekanntes JSON Format");
                            }
                        } else {
                            throw new Error("Kein Objekt");
                        }
                    } catch (e) {
                        // FALL C: Reiner Text (kein JSON)
                        // Prüfe ob es ein unvollständiger Multi-Part QR-Code ist
                        if (trimmed.startsWith('qrp|')) {
                            alert('Unvollständiger Multi-Part QR-Code erkannt. Bitte alle QR-Codes der Reihe nach scannen, ohne den Scanner zu schließen.');
                            return;
                        }
                        if (trimmed.length > 0) {
                            confirmIfNeeded(() => applyImport(trimmed));
                        }
                    }
                }
            }} />}
        </div>
    );
};

export default App;
