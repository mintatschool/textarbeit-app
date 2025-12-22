import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { EmptyStateMessage } from './EmptyStateMessage';

export const WordListView = ({ words, columnsState, setColumnsState, onClose, settings, setSettings, onRemoveWord, onWordUpdate }) => {
    if (!words || words.length === 0) return (<div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans"><EmptyStateMessage onClose={onClose} /></div>);
    const [columnCount, setColumnCount] = useState(1);
    const dragItemRef = useRef(null);


    useEffect(() => {
        if (Object.keys(columnsState.cols).length === 0 && words.length > 0) {
            setColumnsState({ cols: { 'col-1': { id: 'col-1', title: '', items: words } }, order: ['col-1'] });
        } else {
            // Robust Sync: Match by ID first, then by Index (for renames/capitalization), then treat as new
            const newWordsByIndex = new Map(words.map(w => [w.index, w]));
            const usedIndices = new Set();
            const newCols = { ...columnsState.cols };

            let hasChanges = false;

            Object.keys(newCols).forEach(colId => {
                const items = newCols[colId].items;
                const newItems = items.map(oldItem => {
                    // Try to find exact match (e.g. no change)
                    // Note: words have 'index' property. older items typically do too.

                    // Case 1: ID Match (Best)
                    const exactMatch = words.find(w => w.id === oldItem.id);
                    if (exactMatch) {
                        usedIndices.add(exactMatch.index);
                        return exactMatch;
                    }

                    // Case 2: Index Match (Renamed/Capitalized)
                    // Extract index from old ID "Word_Index"
                    const parts = oldItem.id.lastIndexOf('_');
                    if (parts !== -1) {
                        const idx = parseInt(oldItem.id.substring(parts + 1), 10);
                        if (!isNaN(idx)) {
                            const indexMatch = newWordsByIndex.get(idx);
                            if (indexMatch) {
                                usedIndices.add(indexMatch.index);
                                return indexMatch;
                            }
                        }
                    }

                    return null; // Deleted
                }).filter(Boolean);

                // Detection if array actually changed to avoid loop
                const idsOld = items.map(i => i.id).join(',');
                const idsNew = newItems.map(i => i.id).join(',');
                if (idsOld !== idsNew) {
                    newCols[colId] = { ...newCols[colId], items: newItems };
                    hasChanges = true;
                }
            });

            // Add completely new words (not mapped)
            const missing = words.filter(w => !usedIndices.has(w.index));
            if (missing.length > 0) {
                const firstColId = columnsState.order[0];
                if (firstColId && newCols[firstColId]) {
                    const targetCol = newCols[firstColId];
                    newCols[firstColId] = { ...targetCol, items: [...targetCol.items, ...missing] };
                    hasChanges = true;
                }
            }

            if (hasChanges) setColumnsState({ ...columnsState, cols: newCols });
        }
    }, [words]);

    useEffect(() => {
        const currentOrder = columnsState.order;
        const currentCount = currentOrder.length;
        if (currentCount === columnCount) return;

        const newCols = { ...columnsState.cols };
        let newOrder = [...currentOrder];

        if (columnCount > currentCount) {
            // Add columns
            for (let i = currentCount + 1; i <= columnCount; i++) {
                const id = `col-${i}`;
                if (!newCols[id]) {
                    newCols[id] = { id, title: '', items: [] };
                }
                newOrder.push(id);
            }
        } else {
            // Remove columns (and rescue items to col-1)
            const targetId = 'col-1';
            for (let i = currentCount; i > columnCount; i--) {
                const id = `col-${i}`;
                if (newCols[id] && newCols[id].items.length > 0) {
                    // Move items to col-1 or just keep them?
                    // Moving to col-1 is safer to avoid losing words.
                    if (newCols[targetId]) {
                        newCols[targetId] = {
                            ...newCols[targetId],
                            items: [...newCols[targetId].items, ...newCols[id].items]
                        };
                    }
                }
                // Technically we don't *have* to delete from 'cols', just remove from 'order'
                // But keeping 'cols' clean is better.
                delete newCols[id];
                newOrder.pop();
            }
        }
        setColumnsState({ ...columnsState, cols: newCols, order: newOrder });
    }, [columnCount]);

    const handleDragStart = (e, type, item, sourceColId = null, index = null) => {
        e.stopPropagation();
        dragItemRef.current = { type, item, sourceColId, index };
        e.dataTransfer.effectAllowed = 'move';
        if (type === 'column') {
            e.dataTransfer.setData('text/plain', item); // colId
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnd = () => {
        dragItemRef.current = null;
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'bg-blue-50'));
    };

    const handleDragEnterCol = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-blue-50');
    };

    const handleDragLeaveCol = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-50');
    };

    const handleDropOnColumn = (e, targetColId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-50');
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
            // Moved to column but NOT on a specific item -> Append to end
            const { item: word, sourceColId, index: sourceIdx } = dragData;
            if (sourceColId === targetColId) {
                // Moved within same column to end?
                // If dropped on column background, usually means append.
                // Let's call handleDropOnItem with index = length
                const targetItems = columnsState.cols[targetColId].items;
                handleDropOnItem(e, targetColId, targetItems.length);
            } else {
                // Move to different column end
                handleDropOnItem(e, targetColId, columnsState.cols[targetColId].items.length);
            }
        }
    };

    const handleDropOnItem = (e, targetColId, targetIndex) => {
        e.preventDefault();
        e.stopPropagation();
        const dragData = dragItemRef.current;
        if (!dragData || dragData.type !== 'word') return;

        const { item: word, sourceColId, index: sourceIdx } = dragData;
        if (sourceColId === targetColId && sourceIdx === targetIndex) return;

        const newCols = { ...columnsState.cols };
        const sourceItems = [...newCols[sourceColId].items];
        // Clone properly
        const targetItems = sourceColId === targetColId ? sourceItems : [...newCols[targetColId].items];

        // 1. Remove from source
        sourceItems.splice(sourceIdx, 1);

        // 2. Insert into target
        // Calculate insertion index
        let insertIndex = targetIndex;
        // If same column and source was BEFORE target, removal shifted target index down.
        if (sourceColId === targetColId && sourceIdx < targetIndex) {
            insertIndex = targetIndex; // Wait, if I drop at 5 (was 5). I removed 2. 
            // The item at 5 is now at 4.
            // If I want to be *at pos 5* (after the old 5? or before?)
            // Usually "Drop On" implies "Before".
            // If I drop on "C". I want "A C". "A" is before "C".
            // Old List: A(0), B(1), C(2).
            // Drag A to C(2).
            // Remove A. [B, C]. C is at 1.
            // targetIndex passed is 2 (index of C in OLD list).
            // I want to insert at 1 (Before C).
            // So insertIndex = targetIndex - 1.
            insertIndex = targetIndex - 1;
        }

        // Safety bounds
        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > targetItems.length) insertIndex = targetItems.length;

        targetItems.splice(insertIndex, 0, word);

        if (sourceColId !== targetColId) {
            newCols[sourceColId] = { ...newCols[sourceColId], items: sourceItems };
            newCols[targetColId] = { ...newCols[targetColId], items: targetItems };
        } else {
            // Already modified sourceItems which IS targetItems
            newCols[sourceColId] = { ...newCols[sourceColId], items: sourceItems };
        }

        setColumnsState({ ...columnsState, cols: newCols });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col modal-animate font-sans">
            <div className="bg-white px-6 py-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.List className="text-blue-600" /> Wortliste</h2>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} onClick={() => setColumnCount(num)} className={`w-8 h-8 rounded font-bold text-sm min-touch-target ${columnCount === num ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{num}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg w-full md:w-auto justify-center">
                    <span className="text-xs font-bold text-slate-500">A</span>
                    <input type="range" min="16" max="64" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-48 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer" />
                    <span className="text-xl font-bold text-slate-500">A</span>
                </div>
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-10 h-10 shadow-sm transition-transform hover:scale-105 flex items-center justify-center min-touch-target sticky right-0"><Icons.X size={24} /></button>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scroll">
                <div className={`flex gap-6 h-full transition-all duration-300 ${columnCount === 1 ? 'w-1/2 min-w-[350px] mr-auto' : 'min-w-full'}`} style={{ width: columnCount === 1 ? undefined : `${Math.max(100, columnCount * 300)}px` }}>
                    {columnsState.order.map(colId => {
                        const col = columnsState.cols[colId];
                        return (
                            <div key={colId} draggable onDragStart={(e) => handleDragStart(e, 'column', colId)} onDragOver={handleDragOver} onDragLeave={handleDragLeaveCol} onDragEnter={handleDragEnterCol} onDrop={(e) => handleDropOnColumn(e, colId)} className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-[280px] h-full transition-colors group/col">
                                <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors" title="Spalte verschieben">
                                    <input type="text" placeholder="Titel eingeben..." className="w-full bg-transparent font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none text-center" value={col.title} onChange={(e) => { const newCols = { ...columnsState.cols, [colId]: { ...col, title: e.target.value } }; setColumnsState({ ...columnsState, cols: newCols }); }} onMouseDown={(e) => e.stopPropagation()} />
                                </div>
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
