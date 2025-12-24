import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

export const WordListView = ({ words, columnsState, setColumnsState, onClose, settings, setSettings, onRemoveWord, onWordUpdate, wordColors = {}, colorHeaders = {}, setColorHeaders, colorPalette = [] }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [columnCount, setColumnCount] = useState(1);
    const [sortByColor, setSortByColor] = useState(false);
    const dragItemRef = useRef(null);

    // Helper to resolve palette-X to hex
    const resolveColor = (colorCode) => {
        if (!colorCode) return 'transparent';
        if (colorCode === 'yellow') return 'yellow'; // Should not happen in this view usually
        if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
            const idx = parseInt(colorCode.split('-')[1], 10);
            return colorPalette && colorPalette[idx] ? colorPalette[idx] : 'transparent';
        }
        return colorCode; // Legacy hex
    };

    // Color Sorting Logic
    const prevSortByColor = useRef(sortByColor);
    const prevWordsProp = useRef(words);

    // Initial State / Sync Effect
    useEffect(() => {
        // 1. Detect Toggles
        const switchedToColor = sortByColor && !prevSortByColor.current;
        const switchedToStandard = !sortByColor && prevSortByColor.current;
        prevSortByColor.current = sortByColor;

        if (switchedToColor) {
            // Group indices by color key (palette-X or hex)
            const colorGroups = {}; // key -> items
            const noColorItems = [];

            words.forEach(w => {
                const colorKey = wordColors[w.index];
                if (colorKey && colorKey !== 'yellow') {
                    if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
                    colorGroups[colorKey].push(w);
                } else {
                    noColorItems.push(w);
                }
            });

            const uniqueKeys = Object.keys(colorGroups);
            const newCols = {};
            const newOrder = [];

            uniqueKeys.forEach((key, idx) => {
                const id = `col-color-${idx}`;
                const persistedTitle = colorHeaders[key] || '';
                newCols[id] = { id, title: persistedTitle, color: key, items: colorGroups[key] };
                newOrder.push(id);
            });

            if (noColorItems.length > 0) {
                const id = 'col-no-color';
                newCols[id] = { id, title: 'Keine Farbe', items: noColorItems };
                newOrder.push(id);
            }

            setColumnsState({ cols: newCols, order: newOrder });
            setColumnCount(newOrder.length);
            return;
        }

        if (switchedToStandard) {
            // Reset to 1 column view but keep word titles from first column if any?
            // Actually, usually users want the words back in one list.
            setColumnsState({ cols: { 'col-1': { id: 'col-1', title: '', items: words } }, order: ['col-1'] });
            setColumnCount(1);
            return;
        }

        // 2. Initial Setup if Empty
        if (Object.keys(columnsState.cols).length === 0 && words.length > 0) {
            if (sortByColor) {
                // Trigger grouping logic (same as above, but for initial load)
                // This handles the case where someone opens the list and sort is already true
                const colorGroups = {};
                const noColorItems = [];
                words.forEach(w => {
                    const ck = wordColors[w.index];
                    if (ck && ck !== 'yellow') {
                        if (!colorGroups[ck]) colorGroups[ck] = [];
                        colorGroups[ck].push(w);
                    } else {
                        noColorItems.push(w);
                    }
                });
                const newCols = {}; const newOrder = [];
                Object.keys(colorGroups).forEach((key, idx) => {
                    const id = `col-color-${idx}`;
                    newCols[id] = { id, title: colorHeaders[key] || '', color: key, items: colorGroups[key] };
                    newOrder.push(id);
                });
                if (noColorItems.length > 0) {
                    const id = 'col-no-color';
                    newCols[id] = { id, title: 'Keine Farbe', items: noColorItems };
                    newOrder.push(id);
                }
                setColumnsState({ cols: newCols, order: newOrder });
                setColumnCount(newOrder.length);
            } else {
                setColumnsState({ cols: { 'col-1': { id: 'col-1', title: '', items: words } }, order: ['col-1'] });
            }
        }
    }, [sortByColor, words, wordColors, colorPalette]);

    // 3. Word Content Sync (If text changes while list is open)
    useEffect(() => {
        if (prevWordsProp.current === words) return;
        prevWordsProp.current = words;

        // Robust Sync Logic for word removals/additions
        const newWordsByIndex = new Map(words.map(w => [w.index, w]));
        const usedIndices = new Set();
        const newCols = { ...columnsState.cols };
        let hasChanges = false;

        Object.keys(newCols).forEach(colId => {
            const items = newCols[colId].items;
            const newItems = items.map(oldItem => {
                const exactMatch = words.find(w => w.id === oldItem.id);
                if (exactMatch) { usedIndices.add(exactMatch.index); return exactMatch; }
                const parts = oldItem.id.lastIndexOf('_');
                if (parts !== -1) {
                    const idx = parseInt(oldItem.id.substring(parts + 1), 10);
                    if (!isNaN(idx)) {
                        const indexMatch = newWordsByIndex.get(idx);
                        if (indexMatch) { usedIndices.add(indexMatch.index); return indexMatch; }
                    }
                }
                return null;
            }).filter(Boolean);

            if (items.length !== newItems.length || items.some((it, i) => it.id !== newItems[i].id)) {
                newCols[colId] = { ...newCols[colId], items: newItems };
                hasChanges = true;
            }
        });

        const missing = words.filter(w => !usedIndices.has(w.index));
        if (missing.length > 0 && columnsState.order.length > 0) {
            const targetColId = columnsState.order[0];
            newCols[targetColId] = { ...newCols[targetColId], items: [...newCols[targetColId].items, ...missing] };
            hasChanges = true;
        }

        if (hasChanges) setColumnsState(prev => ({ ...prev, cols: newCols }));
    }, [words]);

    // 4. Column Count Change (Manual in Grundfunktion)
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
    }, [columnCount, sortByColor]); // Add sortByColor to refire if needed

    const handleDragStart = (e, type, item, sourceColId = null, index = null) => {
        // Disable Dragging in SortByColor mode? The requirement doesn't say so, but logic might break if we move colored word to different color column?
        // Let's allow it but warn or just let it happen (visuals might mismatch but data is consistent).
        // Actually, if I drag a RED word to a GREEN column, does it become GREEN?
        // Requirement: "Wörter entsprechend ihrer Farbe in die Spalten sortiert".
        // Implies strict mapping. Moving might define color?
        // For now, let's keep it simple: allow move, but color remains properly rendered.
        e.stopPropagation();
        dragItemRef.current = { type, item, sourceColId, index };
        e.dataTransfer.effectAllowed = 'move';
        if (type === 'column') {
            e.dataTransfer.setData('text/plain', item);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDragEnd = () => { dragItemRef.current = null; document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'bg-blue-50')); };
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

    // Extracted Drop Logic for re-use
    const handleDropOnItemLogic = (targetColId, targetIndex) => {
        const dragData = dragItemRef.current;
        if (!dragData || dragData.type !== 'word') return;
        const { item: word, sourceColId, index: sourceIdx } = dragData;
        if (sourceColId === targetColId && sourceIdx === targetIndex) return;

        const newCols = { ...columnsState.cols };
        const sourceItems = [...newCols[sourceColId].items];
        const targetItems = sourceColId === targetColId ? sourceItems : [...newCols[targetColId].items];

        sourceItems.splice(sourceIdx, 1);

        let insertIndex = targetIndex;
        if (sourceColId === targetColId && sourceIdx < targetIndex) insertIndex = targetIndex - 1;
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

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            <div className="bg-white px-6 py-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.List className="text-blue-600" /> Wortliste</h2>

                    {/* Column Controls */}
                    <div className={`flex items-center gap-4 ${sortByColor ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                            {[1, 2, 3, 4, 5].map(num => (
                                <button key={num} onClick={() => setColumnCount(num)} className={`w-8 h-8 rounded font-bold text-sm min-touch-target ${columnCount === num ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{num}</button>
                            ))}
                        </div>
                    </div>

                    {/* SORT BY COLOR TOGGLE */}
                    <button
                        onClick={() => setSortByColor(!sortByColor)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${sortByColor ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Icons.Palette size={20} />
                        nach Farben sortieren
                    </button>

                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg w-full md:w-auto justify-center">
                    <span className="text-xs font-bold text-slate-500">A</span>
                    <input type="range" min="16" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                    <span className="text-xl font-bold text-slate-500">A</span>
                </div>
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scroll">
                <div className={`flex gap-6 h-full transition-all duration-300 ${!sortByColor && columnCount === 1 ? 'w-1/2 min-w-[350px] mr-auto' : 'min-w-full'}`} style={{ width: (!sortByColor && columnCount === 1) ? undefined : `${Math.max(100, columnsState.order.length * 300)}px` }}>
                    {columnsState.order.map(colId => {
                        const col = columnsState.cols[colId];
                        // Dynamic Header Styling if Color Sort is active
                        // col.color is either 'palette-X' or hex. resolveColor gets the display hex.
                        const resolvedBg = resolveColor(col.color);
                        const headerStyle = sortByColor && col.color ? { backgroundColor: resolvedBg, color: 'white', fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 1.1}px` } : {};
                        const headerClass = sortByColor && col.color ? "p-3 rounded-t-xl shadow-sm text-center font-bold" : "p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors";

                        return (
                            <div key={colId} draggable={true} onDragStart={(e) => handleDragStart(e, 'column', colId)} onDragOver={handleDragOver} onDragLeave={handleDragLeaveCol} onDragEnter={handleDragEnterCol} onDrop={(e) => handleDropOnColumn(e, colId)} className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-[280px] h-full transition-colors group/col">
                                {sortByColor ? (
                                    <div className={headerClass} style={headerStyle}>
                                        <input
                                            type="text"
                                            placeholder="Titel..."
                                            className="w-full bg-transparent font-bold placeholder:text-white/50 focus:outline-none text-center"
                                            style={{ color: 'white', fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                            value={col.title || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newCols = { ...columnsState.cols, [colId]: { ...col, title: val } };
                                                setColumnsState({ ...columnsState, cols: newCols });
                                                if (col.color && setColorHeaders) {
                                                    setColorHeaders(prev => ({ ...prev, [col.color]: val }));
                                                }
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ) : (
                                    <div className={headerClass} title="Spalte verschieben">
                                        <input
                                            type="text"
                                            placeholder="Titel eingeben..."
                                            className="w-full bg-transparent font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none text-center"
                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                            value={col.title}
                                            onChange={(e) => { const newCols = { ...columnsState.cols, [colId]: { ...col, title: e.target.value } }; setColumnsState({ ...columnsState, cols: newCols }); }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll min-h-[100px]">
                                    {col.items.map((word, idx) => (
                                        <div key={word.id} draggable onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, 'word', word, colId, idx); }} onDragEnd={handleDragEnd} onDrop={(e) => handleDropOnItem(e, colId, idx)} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing group relative select-none touch-action-none" style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>
                                            <div className="text-center pointer-events-auto">
                                                {word.syllables ? (
                                                    <span className="inline-block whitespace-nowrap">
                                                        {word.syllables.map((s, i) => {
                                                            const isEven = i % 2 === 0;
                                                            // Logic for visual types
                                                            let styleClass = "";
                                                            let textClass = "";
                                                            if (settings.visualType === 'block') {
                                                                styleClass = isEven ? 'bg-blue-100 border-blue-200' : 'bg-blue-200 border-blue-300';
                                                                styleClass += " border rounded px-1 mx-[1px]";
                                                            } else if (settings.visualType === 'black_gray') {
                                                                textClass = isEven ? "text-black" : "text-gray-400";
                                                            } else {
                                                                textClass = isEven ? "text-blue-700" : "text-red-600";
                                                            }

                                                            return (
                                                                <span key={i} className={`inline-block ${styleClass}`}>
                                                                    {s.split('').map((char, cIdx) => (
                                                                        <span
                                                                            key={cIdx}
                                                                            className={`${textClass} cursor-pointer hover:bg-slate-100 rounded px-px`}
                                                                            onClick={(e) => {
                                                                                if (i === 0 && cIdx === 0) {
                                                                                    // Toggle Capitalization of first char
                                                                                    e.stopPropagation();
                                                                                    const firstChar = word.word.charAt(0);
                                                                                    const isUpper = firstChar === firstChar.toUpperCase();
                                                                                    const newWord = (isUpper ? firstChar.toLowerCase() : firstChar.toUpperCase()) + word.word.slice(1);
                                                                                    onWordUpdate(word.id, newWord);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {char}
                                                                        </span>
                                                                    ))}
                                                                    {settings.visualType === 'arc' && (
                                                                        <svg className="arc-svg pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ display: 'block', height: '0.2em', width: '100%', marginTop: '-0.1em' }}><path d="M 2 2 Q 50 20 98 2" fill="none" stroke={isEven ? '#2563eb' : '#dc2626'} strokeWidth="8" strokeLinecap="round" /></svg>
                                                                    )}
                                                                </span>
                                                            );
                                                        })}
                                                    </span>
                                                ) : word.word}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); onRemoveWord(word.id); }} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white min-touch-target cursor-pointer z-20"><Icons.X size={14} /></button>
                                        </div>
                                    ))}
                                    <div className="h-12 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-sm italic hover:border-blue-200 transition-colors">
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
