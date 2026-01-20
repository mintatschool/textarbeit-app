import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';
import { WordListCell } from './WordListCell';

export const WordListView = ({ words, columnsState, setColumnsState, onClose, settings, setSettings, onRemoveWord, onWordUpdate, wordColors = {}, colorHeaders = {}, setColorHeaders, colorPalette = [], title, groups = [], sortByColor, setSortByColor, columnCount, setColumnCount, updateTimestamp, activeColor, isTextMarkerMode, onToggleLetterMarker, toggleHighlights, highlightedIndices }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col items-center justify-center modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [isDragging, setIsDragging] = useState(false);
    const dragItemRef = useRef(null);
    const prevWordsProp = useRef(null);

    const [interactionMode, setInteractionMode] = useState('case');
    const [showSortAlert, setShowSortAlert] = useState(false);

    // Sync interactionMode if activeColor/isTextMarkerMode changes from outside (Toolbar)
    useEffect(() => {
        if (!isTextMarkerMode && activeColor === 'yellow') {
            setInteractionMode('mark');
        }
    }, [activeColor, isTextMarkerMode]);

    // Alert auto-hide
    useEffect(() => {
        if (showSortAlert) {
            const timer = setTimeout(() => setShowSortAlert(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSortAlert]);

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

    // Helper to resolve palette-X to hex
    const resolveColor = (colorCode) => {
        if (!colorCode) return 'transparent';
        if (colorCode === 'yellow') return 'yellow';
        if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
            const idx = parseInt(colorCode.split('-')[1], 10);
            return colorPalette && colorPalette[idx] ? colorPalette[idx] : 'transparent';
        }
        return colorCode; // Legacy hex
    };

    // Color Sorting Logic
    const prevSortByColor = useRef(sortByColor);

    // 0. Pre-process groups - Derived State
    const displayWords = React.useMemo(() => {
        let result = [];
        const processedIndices = new Set();
        const sortedInput = [...words].sort((a, b) => a.index - b.index);

        sortedInput.forEach(w => {
            if (processedIndices.has(w.index)) return;

            const group = groups.find(g => g.ids.includes(w.index));
            if (group) {
                const groupMembers = group.ids.map(id => sortedInput.find(sw => sw.index === id)).filter(Boolean);
                if (groupMembers.length > 0) {
                    groupMembers.sort((a, b) => a.index - b.index);
                    const compositeWord = {
                        ...groupMembers[0],
                        word: groupMembers.map(m => m.word).join(' '),
                        id: `group-${group.ids.join('-')}`,
                        isGroup: true,
                        syllables: groupMembers.flatMap((m, idx) => {
                            const rawSyls = m.syllables || [m.word];
                            let currentPos = m.index;
                            const mapped = rawSyls.map(s => {
                                const item = { text: s, sourceId: m.id, sourceWord: m.word, absStartIndex: currentPos };
                                currentPos += s.length;
                                return item;
                            });
                            return idx < groupMembers.length - 1 ? [...mapped, { text: ' ', isSpace: true, absStartIndex: currentPos++ }] : mapped;
                        })
                    };
                    group.ids.forEach(id => processedIndices.add(id));
                    result.push(compositeWord);
                } else {
                    const simpleW = {
                        ...w, syllables: (w.syllables || [w.word]).reduce((acc, s) => {
                            const start = acc.length > 0 ? acc[acc.length - 1].absStartIndex + acc[acc.length - 1].text.length : w.index;
                            acc.push({ text: s, sourceId: w.id, sourceWord: w.word, absStartIndex: start });
                            return acc;
                        }, [])
                    };
                    result.push(simpleW);
                    processedIndices.add(w.index);
                }
            } else {
                const simpleW = {
                    ...w, syllables: (w.syllables || [w.word]).reduce((acc, s) => {
                        const start = acc.length > 0 ? acc[acc.length - 1].absStartIndex + acc[acc.length - 1].text.length : w.index;
                        acc.push({ text: s, sourceId: w.id, sourceWord: w.word, absStartIndex: start });
                        return acc;
                    }, [])
                };
                result.push(simpleW);
                processedIndices.add(w.index);
            }
        });
        return result;
    }, [words, groups]);

    // 1. Initial State Setup
    useEffect(() => {
        const switchedToColor = sortByColor && !prevSortByColor.current;
        const switchedToStandard = !sortByColor && prevSortByColor.current;
        prevSortByColor.current = sortByColor;

        if (switchedToColor) {
            const colorGroups = {};
            const noColorItems = [];
            displayWords.forEach(w => {
                const k = wordColors[w.index];
                if (k && k !== 'yellow') {
                    if (!colorGroups[k]) colorGroups[k] = [];
                    colorGroups[k].push(w);
                } else noColorItems.push(w);
            });
            const newCols = {}; const newOrder = [];
            Object.keys(colorGroups).forEach((key, idx) => {
                const id = `col-color-${idx}`;
                newCols[id] = { id, title: colorHeaders[key] || '', color: key, items: colorGroups[key] };
                newOrder.push(id);
            });
            /* 
            if (noColorItems.length > 0) {
                const id = 'col-no-color';
                newCols[id] = { id, title: 'Keine Farbe', items: noColorItems };
                newOrder.push(id);
            } 
            */
            setColumnsState({ cols: newCols, order: newOrder });
            setColumnCount(newOrder.length);
            return;
        }

        if (switchedToStandard) {
            setColumnsState({ cols: { 'col-1': { id: 'col-1', title: '', items: displayWords } }, order: ['col-1'] });
            setColumnCount(1);
            return;
        }

        if (Object.keys(columnsState.cols).length === 0 && displayWords.length > 0) {
            if (sortByColor) {
                const colorGroups = {}; const noColorItems = [];
                displayWords.forEach(w => {
                    const k = wordColors[w.index];
                    if (k && k !== 'yellow') {
                        if (!colorGroups[k]) colorGroups[k] = [];
                        colorGroups[k].push(w);
                    } else noColorItems.push(w);
                });
                const newCols = {}; const newOrder = [];
                Object.keys(colorGroups).forEach((key, idx) => {
                    const id = `col-color-${idx}`;
                    newCols[id] = { id, title: colorHeaders[key] || '', color: key, items: colorGroups[key] };
                    newOrder.push(id);
                });
                /*
                if (noColorItems.length > 0) {
                    const id = 'col-no-color';
                    newCols[id] = { id, title: 'Keine Farbe', items: noColorItems };
                    newOrder.push(id);
                }
                */
                setColumnsState({ cols: newCols, order: newOrder });
                setColumnCount(newOrder.length);
            } else {
                setColumnsState({ cols: { 'col-1': { id: 'col-1', title: '', items: displayWords } }, order: ['col-1'] });
            }
        }
    }, [sortByColor, words, wordColors, colorPalette, groups]);

    // 3. Word Content Sync (If text changes while list is open)
    // 3. Word Content Sync (If text changes while list is open)
    const prevTimestamp = useRef(updateTimestamp);
    useEffect(() => {
        const wordsChanged = prevWordsProp.current !== words;
        const timestampChanged = prevTimestamp.current !== updateTimestamp;

        if (!wordsChanged && !timestampChanged) return;

        console.log("WordListView: Sync triggered. Words changed:", wordsChanged, "Timestamp changed:", timestampChanged);

        prevWordsProp.current = words;
        prevTimestamp.current = updateTimestamp;

        setColumnsState(prevState => {
            const newCols = { ...prevState.cols };
            let hasChanges = false;

            const currentDisplayWords = displayWords;
            const newDisplayMap = new Map(currentDisplayWords.map(w => [w.id, w]));
            const existingIdsInCols = new Set();

            // 1. Update existing items and remove deleted ones
            Object.keys(newCols).forEach(colId => {
                const col = newCols[colId];
                let colHasChanges = false;

                const updatedItems = col.items.map(item => {
                    const freshData = newDisplayMap.get(item.id);
                    if (freshData) {
                        existingIdsInCols.add(item.id);
                        // Check if content actually changed to avoid unnecessary state updates
                        if (JSON.stringify(freshData) !== JSON.stringify(item)) {
                            console.log("WordListView: Detected change for", item.id, item.word, "->", freshData.word);
                            colHasChanges = true;
                            return freshData;
                        }
                        return item;
                    }
                    colHasChanges = true;
                    return null; // Mark for removal
                }).filter(Boolean);

                if (colHasChanges) {
                    newCols[colId] = { ...col, items: updatedItems };
                    hasChanges = true;
                }
            });

            // 2. Find Added Items (That are NOT in any column)
            const addedItems = currentDisplayWords.filter(w => !existingIdsInCols.has(w.id));
            if (addedItems.length > 0) {
                addedItems.forEach(newItem => {
                    let targetColId;
                    if (sortByColor) {
                        const color = wordColors[newItem.index];
                        if (color && color !== 'yellow') {
                            const colEntry = Object.entries(newCols).find(([_, c]) => c.color === color);
                            if (colEntry) {
                                targetColId = colEntry[0];
                            }
                        }
                    } else {
                        targetColId = prevState.order[0];
                    }

                    if (targetColId && newCols[targetColId]) {
                        newCols[targetColId] = {
                            ...newCols[targetColId],
                            items: [...newCols[targetColId].items, newItem]
                        };
                        hasChanges = true;
                    }
                });
            }

            return hasChanges ? { ...prevState, cols: newCols } : prevState;
        });

    }, [words, displayWords, sortByColor, wordColors, updateTimestamp]);

    // 4. Column Count Change
    useEffect(() => {
        if (sortByColor) return;
        const currentOrder = columnsState.order;
        const currentCount = currentOrder.length;
        if (currentCount === 0 || currentCount === columnCount) return;

        const newCols = { ...columnsState.cols };
        let newOrder = [...currentOrder];

        if (columnCount > currentCount) {
            // Add columns
            for (let i = currentCount + 1; i <= columnCount; i++) {
                const id = `col-${i}`;
                if (!newCols[id]) newCols[id] = { id, title: '', items: [] };
                newOrder.push(id);
            }
        } else {
            // Remove columns (move items to col-1)
            const targetId = currentOrder[0];
            for (let i = currentCount - 1; i >= columnCount; i--) {
                const colId = currentOrder[i];
                if (newCols[colId]) {
                    newCols[targetId].items = [...newCols[targetId].items, ...newCols[colId].items];
                    delete newCols[colId];
                    newOrder.pop();
                }
            }
        }
        setColumnsState(prev => ({ ...prev, cols: newCols, order: newOrder }));
    }, [columnCount, sortByColor]);

    const handleDragStart = (e, type, item, sourceColId = null, index = null) => {
        e.stopPropagation();
        setIsDragging(true);
        dragItemRef.current = { type, item, sourceColId, index };
        e.dataTransfer.effectAllowed = 'move';

        // Safari/iPad Fix: Always set data
        if (type === 'column') {
            e.dataTransfer.setData('text/plain', item);
        } else if (type === 'word') {
            // Use JSON for internal logic, text for compatibility
            e.dataTransfer.setData('application/json', JSON.stringify(item));
            e.dataTransfer.setData('text/plain', item.word);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDragEnd = () => {
        setIsDragging(false);
        dragItemRef.current = null;
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'bg-blue-50'));
    };
    const handleDragEnterCol = (e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); };
    const handleDragLeaveCol = (e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-50'); };
    const handleDropOnColumn = (e, targetColId) => {
        e.preventDefault(); e.currentTarget.classList.remove('bg-blue-50');
        const dragData = dragItemRef.current;
        if (!dragData) return;
        if (dragData.type === 'column') {
            const sourceColId = dragData.item;
            if (sourceColId === targetColId) return;
            const newOrder = [...columnsState.order];
            const loadIdx = newOrder.indexOf(sourceColId);
            const dropIdx = newOrder.indexOf(targetColId);
            if (loadIdx !== -1 && dropIdx !== -1) {
                newOrder.splice(loadIdx, 1);
                newOrder.splice(dropIdx, 0, sourceColId);
                setColumnsState({ ...columnsState, order: newOrder });
            }
        } else if (dragData.type === 'word') {
            const { item: word, sourceColId, index: sourceIdx } = dragData;
            // Append to end
            const targetItems = columnsState.cols[targetColId].items;
            handleDropOnItemLogic(targetColId, targetItems.length);
        }
    };

    const handleDropOnItemLogic = (targetColId, targetIndex) => {
        const dragData = dragItemRef.current;
        if (!dragData || dragData.type !== 'word') return;
        const { item: word, sourceColId } = dragData;

        // Use ID check for safety instead of pure index
        // But we still need sourceIdx reference? No, find it fresh.
        const newCols = { ...columnsState.cols };
        const sourceItems = [...newCols[sourceColId].items];

        // Find current index of the item to remove (Safe against index shifts)
        const currentSourceIdx = sourceItems.findIndex(i => i.id === word.id);
        if (currentSourceIdx === -1) return; // Item gone? Abort.

        if (sourceColId === targetColId && currentSourceIdx === targetIndex) return;

        const targetItems = sourceColId === targetColId ? sourceItems : [...newCols[targetColId].items];

        sourceItems.splice(currentSourceIdx, 1);

        let insertIndex = targetIndex;
        // If moving within same column and we removed an item BEFORE the target, shift target back
        if (sourceColId === targetColId && currentSourceIdx < targetIndex) insertIndex = targetIndex - 1;

        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > targetItems.length) insertIndex = targetItems.length;

        targetItems.splice(insertIndex, 0, word);

        if (sourceColId !== targetColId) {
            newCols[sourceColId] = { ...newCols[sourceColId], items: sourceItems };
            newCols[targetColId] = { ...newCols[targetColId], items: targetItems };
        } else {
            newCols[sourceColId] = { ...newCols[sourceColId], items: sourceItems };
        }
        setColumnsState({ ...columnsState, cols: newCols });
    };

    const handleDropOnItem = (e, targetColId, targetIndex) => {
        e.preventDefault(); e.stopPropagation();
        handleDropOnItemLogic(targetColId, targetIndex);
    };

    // Panning Logic (Mouse + Touch)
    const containerRef = useRef(null);
    const panningRef = useRef({ isPanning: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

    // Check if touch/click is on interactive element
    const isInteractiveTarget = (target) => {
        return target.closest('[draggable="true"]') || target.closest('button') || target.closest('input');
    };

    // Mouse handlers
    const handlePanMouseDown = (e) => {
        if (isInteractiveTarget(e.target)) return;

        panningRef.current = {
            isPanning: true,
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        };
        document.body.style.cursor = 'grabbing';
    };

    const handlePanMouseMove = (e) => {
        if (!panningRef.current.isPanning) return;
        e.preventDefault();

        const x = e.clientX;
        const y = e.clientY;
        const walkX = (x - panningRef.current.startX) * 1.5;
        const walkY = (y - panningRef.current.startY) * 1.5;

        if (containerRef.current) {
            containerRef.current.scrollLeft = panningRef.current.scrollLeft - walkX;
            containerRef.current.scrollTop = panningRef.current.scrollTop - walkY;
        }
    };

    const handlePanMouseUp = () => {
        panningRef.current.isPanning = false;
        document.body.style.cursor = '';
    };

    // Touch handlers for tablet/mobile
    const handleTouchStart = (e) => {
        // Only handle single touch for scrolling
        if (e.touches.length !== 1) return;
        if (isInteractiveTarget(e.target)) return;

        const touch = e.touches[0];
        panningRef.current = {
            isPanning: true,
            startX: touch.clientX,
            startY: touch.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        };
    };

    const handleTouchMove = (e) => {
        if (!panningRef.current.isPanning || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const walkX = (touch.clientX - panningRef.current.startX) * 1.2;
        const walkY = (touch.clientY - panningRef.current.startY) * 1.2;

        if (containerRef.current) {
            containerRef.current.scrollLeft = panningRef.current.scrollLeft - walkX;
            containerRef.current.scrollTop = panningRef.current.scrollTop - walkY;
        }
    };

    const handleTouchEnd = () => {
        panningRef.current.isPanning = false;
    };

    useEffect(() => {
        const mouseUpHandler = () => handlePanMouseUp();
        const touchEndHandler = () => handleTouchEnd();
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('touchend', touchEndHandler);
        return () => {
            window.removeEventListener('mouseup', mouseUpHandler);
            window.removeEventListener('touchend', touchEndHandler);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans print-content overflow-hidden">
            <div className="bg-white px-6 py-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 shrink-0 no-print">
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Table className="text-blue-600" size={32} />
                        {title || "Wörterliste/Tabelle"}
                    </h2>

                    {/* Column Controls */}
                    <div className={`flex items-center gap-4 ${sortByColor ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                            {[1, 2, 3, 4, 5].map(num => (
                                <button key={num} onClick={() => setColumnCount(num)} className={`w-8 h-8 rounded font-bold text-sm min-touch-target ${columnCount === num ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{num}</button>
                            ))}
                        </div>
                    </div>

                    {/* INTERACTION MODE TOGGLE (Case Toggle vs Letter Marker) */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => {
                                setInteractionMode('case');
                                if (activeColor === 'yellow' && !isTextMarkerMode) {
                                    onToggleLetterMarker(); // Toggle OFF if it was yellow
                                }
                            }}
                            className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all ${interactionMode === 'case' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
                            title="ersten Buchstaben ändern"
                        >
                            <Icons.LetterCaseToggle size={28} className={interactionMode === 'case' ? 'text-blue-600' : 'text-slate-400'} />
                        </button>

                        <button
                            onClick={() => {
                                setInteractionMode('mark');
                                if (!(activeColor === 'yellow' && !isTextMarkerMode)) {
                                    onToggleLetterMarker(); // Toggle ON if it wasn't yellow
                                }
                            }}
                            className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all ${interactionMode === 'mark' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
                            title="Buchstaben markieren"
                        >
                            <Icons.LetterMarker size={28} className={interactionMode === 'mark' ? 'text-slate-500' : 'text-slate-400'} />
                        </button>
                    </div>

                    {/* SORT BY COLOR TOGGLE */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                if (!sortByColor) {
                                    const hasSortableColors = wordColors && Object.values(wordColors).some(v => v && v !== 'yellow');
                                    if (!hasSortableColors) {
                                        setShowSortAlert(true);
                                        return;
                                    }
                                }
                                setSortByColor(!sortByColor);
                            }}
                            className={`flex items-center gap-2 px-4 h-12 rounded-xl font-bold transition-all text-sm min-touch-target ${sortByColor ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            title="für jede Farbe eine Spalte erzeugen"
                        >
                            <Icons.Palette size={20} />
                            nach Farben sortieren
                        </button>

                        {showSortAlert && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded shadow-lg z-50 text-center whitespace-nowrap">
                                Keine Wörter farbig markiert
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-800"></div>
                            </div>
                        )}
                    </div>

                </div>
                <div className="flex items-center gap-4 ml-auto">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg no-print">
                        <span className="text-xs font-bold text-slate-500">A</span>
                        <input type="range" min="16" max="80" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-32 accent-blue-600 rounded-lg cursor-pointer" />
                        <span className="text-xl font-bold text-slate-500">A</span>
                    </div>
                    <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0">
                        <Icons.X size={24} />
                    </button>
                </div>
            </div>
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-6 custom-scroll cursor-grab active:cursor-grabbing"
                style={{ height: '100%', minHeight: 0 }}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handlePanMouseMove}
                onMouseLeave={handlePanMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`flex gap-6 min-h-full transition-all duration-300 ${!sortByColor && columnCount === 1 ? 'w-1/2 min-w-[350px] mr-auto' : 'min-w-full'}`} style={{ width: (!sortByColor && columnCount === 1) ? undefined : `${Math.max(100, columnsState.order.length * 300)}px` }}>
                    {columnsState.order.map(colId => {
                        const col = columnsState.cols[colId];
                        const resolvedBg = resolveColor(col.color);
                        const headerStyle = sortByColor && col.color ? { backgroundColor: resolvedBg, color: 'white', fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 1.1}px` } : {};
                        const headerClass = sortByColor && col.color ? "p-3 rounded-t-xl shadow-sm text-center font-bold touch-none" : "p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors touch-none";

                        return (
                            <div key={colId} onDragOver={handleDragOver} onDragLeave={handleDragLeaveCol} onDragEnter={handleDragEnterCol} onDrop={(e) => handleDropOnColumn(e, colId)} className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-[280px] transition-colors group/col">
                                {sortByColor ? (
                                    <div className={headerClass} style={headerStyle} draggable={true} onDragStart={(e) => handleDragStart(e, 'column', colId)}>
                                        <input
                                            type="text"
                                            placeholder="Titel..."
                                            className="w-full bg-transparent font-bold placeholder:text-white/50 focus:outline-none text-center cursor-grab active:cursor-grabbing"
                                            style={{ color: 'white', fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, letterSpacing: '0.04em' }}
                                            value={col.title || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newCols = { ...columnsState.cols, [colId]: { ...col, title: val } };
                                                setColumnsState({ ...columnsState, cols: newCols });
                                                if (col.color && setColorHeaders) {
                                                    setColorHeaders(prev => ({ ...prev, [col.color]: val }));
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            draggable={false}
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : (
                                    <div className={headerClass} title="Spalte verschieben" draggable={true} onDragStart={(e) => handleDragStart(e, 'column', colId)}>
                                        <input
                                            type="text"
                                            placeholder="Titel eingeben..."
                                            className="w-full bg-transparent font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none text-center cursor-grab active:cursor-grabbing"
                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px`, letterSpacing: '0.04em' }}
                                            value={col.title}
                                            onChange={(e) => { const newCols = { ...columnsState.cols, [colId]: { ...col, title: e.target.value } }; setColumnsState({ ...columnsState, cols: newCols }); }}
                                            onClick={(e) => e.stopPropagation()}
                                            draggable={false}
                                            spellCheck={false}
                                        />
                                    </div>
                                )}

                                <div className="p-3 space-y-2">
                                    {col.items.map((word, idx) => (
                                        <WordListCell
                                            key={word.id}
                                            word={word}
                                            colId={colId}
                                            idx={idx}
                                            settings={settings}
                                            wordColors={wordColors}
                                            interactionMode={interactionMode}
                                            toggleHighlights={toggleHighlights}
                                            onWordUpdate={onWordUpdate}
                                            onRemoveWord={onRemoveWord}
                                            draggables={{
                                                onDragStart: handleDragStart,
                                                onDragEnd: handleDragEnd,
                                                onDrop: handleDropOnItem,
                                                onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); }
                                            }}
                                        />
                                    ))}
                                    <div className="h-12 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-sm italic hover:border-blue-200 transition-colors no-print">
                                        Hierhin ziehen
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
