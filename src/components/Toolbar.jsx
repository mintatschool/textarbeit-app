import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';
import { MenuDropdown, MenuItem } from './MenuDropdown';

const Separator = ({ horizontal = false }) => (
    horizontal
        ? <div className="w-px h-8 bg-slate-300 mx-1 flex-shrink-0"></div>
        : <div className="w-8 h-px bg-slate-300 my-1 flex-shrink-0 min-h-[1px]"></div>
);

const AVAILABLE_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#a855f7', // purple
    '#f97316', // orange
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#64748b', // slate
    '#84cc16'  // lime
];

const ToolbarButton = ({ onClick, icon: IconComponent, title, active, activeColor = "blue", disabled, className = "" }) => {
    let baseClass = "p-3 rounded-full transition flex-shrink-0 min-touch-target";
    if (className) baseClass = `p-2 transition flex-shrink-0 min-touch-target ${className}`;
    let activeClass = "";

    if (active) {
        // Farb-Logik basierend auf dem Original-Code
        if (activeColor === "orange") activeClass = "bg-orange-500 text-white shadow-lg";
        else if (activeColor === "red") activeClass = "bg-red-600 text-white shadow-lg";
        else if (activeColor === "teal") activeClass = "bg-teal-600 text-white shadow-lg";
        else if (activeColor === "gray") activeClass = "bg-gray-600 text-white shadow-lg";
        else activeClass = "bg-blue-600 text-white shadow-md"; // Default Edit Mode Button
    } else {
        // Einheitliche Hover-Farbe für alle Buttons (außer active)
        activeClass = "text-slate-600 hover:text-blue-600 hover:bg-slate-100";
    }

    // Special Case: Grüner Button im Edit-Mode für View-Switch
    if (activeColor === "emerald") activeClass = "shadow-md text-white bg-emerald-600 hover:bg-emerald-700";

    return (
        <button
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`${baseClass} ${activeClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <IconComponent size={24} className={active && activeColor === 'gray' ? 'opacity-100' : (activeColor === 'gray' ? 'opacity-70' : '')} />
        </button>
    );
};

export const Toolbar = ({
    // State
    isViewMode,
    isReadingMode,
    activeTool,
    isFullscreen,
    text,
    enableCamera,
    isLoading, // Hypher loading status

    // Actions
    onToggleView,
    onResetHighlights,
    onToggleReadingMode,
    onToggleFullscreen,
    onToolChange, // (toolName) => void
    onOpenSettings,
    onClearText,
    onOpenScanner,

    // Modal Toggles
    setShowList,
    setShowCarpet,
    setShowPuzzle,
    setShowStaircase,
    setShowCloud,
    setShowPuzzleTestTwo,
    setShowPuzzleTestMulti,
    setShowSyllableComposition,
    setShowSyllableExtension,
    setShowSplitExercise,
    setShowSentencePuzzle, // Needs logic for 'text' vs 'sentence' mode inside parent
    setShowTextPuzzle,     // Separate prop for text puzzle
    setShowSentenceShuffle, // New: Word shuffle within sentences
    setShowCaseExercise,   // New: Capitalization exercise
    setShowGapWords,       // New: Missing letters exercise
    setShowInitialSound,   // New: Finding initial sounds
    setShowGapSentences,   // New: Missing words in sentences
    setShowGapText,        // New: Full text with gaps

    // Color Props
    colorPalette = [],
    activeColor,
    onSetActiveColor,
    onUpdatePalette,
    settings,
    onMarkAllNeutral // New prop
}) => {
    const [editingColorIndex, setEditingColorIndex] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false); // New state

    // Layout-Klasse: Feste Sidebar rechts (Docked)
    const containerClasses = "fixed right-0 top-0 h-full w-20 flex-col items-center py-4 gap-4 overflow-y-auto custom-scroll border-l rounded-none";

    // Show nothing in Edit Mode
    if (!isViewMode) return null;

    return (
        <div className={`bg-white/95 backdrop-blur-md shadow-2xl border-slate-200 z-[90] transition-all font-sans no-scrollbar flex ${containerClasses}`}>
            {/* --- TOP SECTION: EDIT & RESET --- */}
            <ToolbarButton
                title="Zurück zur Eingabe"
                icon={Icons.Edit2}
                onClick={onToggleView}
                active={true} // Always blue
                className="w-16 h-10 rounded-xl"
            />

            <div className="flex flex-col gap-2 w-full items-center">
                <ToolbarButton
                    title={showResetConfirm ? "Bist du sicher?" : "Alle Markierungen löschen"}
                    icon={showResetConfirm ? Icons.Check : Icons.RotateCcw}
                    onClick={() => {
                        if (showResetConfirm) {
                            onResetHighlights();
                            setShowResetConfirm(false);
                        } else {
                            setShowResetConfirm(true);
                            setTimeout(() => setShowResetConfirm(false), 3000);
                        }
                    }}
                    disabled={isReadingMode}
                    active={showResetConfirm}
                    activeColor="red"
                />

                <ToolbarButton
                    title={showMarkAllConfirm ? "Bist du sicher?" : "Alles markieren (grauer Kasten)"}
                    icon={showMarkAllConfirm ? Icons.Check : Icons.Square}
                    onClick={() => {
                        if (showMarkAllConfirm) {
                            onMarkAllNeutral();
                            setShowMarkAllConfirm(false);
                        } else {
                            setShowMarkAllConfirm(true);
                            setTimeout(() => setShowMarkAllConfirm(false), 3000);
                        }
                    }}
                    disabled={isReadingMode}
                    active={showMarkAllConfirm}
                    activeColor="red"
                />
            </div>

            <Separator horizontal={false} />

            {/* --- MIDDLE SECTION: TOOLS --- */}

            <ToolbarButton
                title="Wortliste/Tabelle"
                icon={Icons.List}
                onClick={() => setShowList(true)}
                disabled={isReadingMode}
                activeColor="purple"
            />

            {/* MENÜ: SILBEN */}
            <MenuDropdown title="Silben" icon={<Icons.MenuSyllables size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowCarpet(true)} icon={<Icons.Grid2x2 size={20} className="text-indigo-600" />}>
                    Silbenteppich
                </MenuItem>
                <MenuItem onClick={() => setShowSyllableComposition(true)} icon={<Icons.PuzzleZigzag size={20} className="text-pink-500" />}>
                    Silben zusammensetzen
                </MenuItem>
                <MenuItem onClick={() => setShowSyllableExtension(true)} icon={<Icons.PuzzleZigzag size={20} className="text-purple-500" />}>
                    Silbenbau (Profi)
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: WÖRTER */}
            <MenuDropdown title="Wörter" icon={<Icons.MenuWords size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowStaircase(true)} icon={<Icons.Stairs size={20} className="text-indigo-600" />}>
                    Treppenwörter
                </MenuItem>
                <MenuItem onClick={() => setShowInitialSound(true)} icon={<Icons.InitialSound size={20} className="text-blue-600" />}>
                    Anlaute finden
                </MenuItem>
                <MenuItem onClick={() => setShowGapWords(true)} icon={<Icons.GapWords size={20} className="text-blue-600" />}>
                    Lückenwörter
                </MenuItem>
                <MenuItem onClick={() => setShowCloud(true)} icon={<Icons.Cloud size={20} className="text-blue-500" />}>
                    Schüttelwörter
                </MenuItem>
                <MenuItem onClick={() => setShowSplitExercise(true)} icon={<Icons.Scissors size={20} className="text-orange-500 -rotate-90" />}>
                    Wörter trennen
                </MenuItem>
                <MenuItem onClick={() => setShowPuzzleTestTwo(true)} icon={<Icons.SyllableTestTwo size={20} className="text-blue-500" />}>
                    Silbenpuzzle leicht
                </MenuItem>
                <MenuItem onClick={() => setShowPuzzleTestMulti(true)} icon={<Icons.SyllableTestMulti size={20} className="text-blue-500" />}>
                    Silbenpuzzle
                </MenuItem>
                <MenuItem
                    onClick={() => setShowPuzzle(true)}
                    icon={<Icons.Puzzle size={20} className="text-slate-300" />}
                    className="!text-slate-300 hover:!text-blue-700"
                >
                    Silbenpuzzle alt
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: SÄTZE */}
            <MenuDropdown title="Sätze" icon={<Icons.MenuSentenceCategory size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowSentenceShuffle(true)} icon={<Icons.Shuffle size={20} className="text-purple-500" />}>
                    Schüttelsätze
                </MenuItem>
                <MenuItem onClick={() => setShowGapSentences(true)} icon={<Icons.GapSentences size={20} className="text-indigo-500" />}>
                    Lückensätze
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: TEXT */}
            <MenuDropdown title="Text" icon={<Icons.TextParagraph size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowSentencePuzzle(true)} icon={<Icons.Sentence size={20} className="text-pink-500" />}>
                    Satzpuzzle
                </MenuItem>
                <MenuItem onClick={() => setShowCloud(true)} icon={<Icons.Cloud size={20} className="text-blue-400" />}>
                    Wortwolke
                </MenuItem>
                <MenuItem onClick={() => setShowCaseExercise(true)} icon={<Icons.Capitalization size={20} className="text-blue-600" />}>
                    Groß-/Kleinschreibung
                </MenuItem>
            </MenuDropdown>

            {/* BLUR TOOL */}
            <ToolbarButton
                title="Wörter verstecken"
                icon={Icons.Ghost}
                onClick={() => onToolChange(activeTool === 'blur' ? null : 'blur')}
                active={activeTool === 'blur'}
                activeColor="gray"
                disabled={isReadingMode}
            />

            <ToolbarButton
                title="Lesemodus"
                icon={Icons.Hand}
                onClick={onToggleReadingMode}
                active={isReadingMode}
                activeColor="orange"
            />

            <Separator horizontal={false} />

            {/* MARKING SYSTEM */}
            <div className="flex flex-col gap-3 items-center p-1 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner w-full">

                {/* 1. NEUTRAL MARKER (Grey Box - Whole Word Frame) */}
                <button
                    onClick={() => onSetActiveColor('neutral')}
                    className={`w-14 h-8 rounded-md border-2 transition-all min-touch-target ${activeColor === 'neutral' ? 'border-slate-500 bg-slate-200 shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50 scale-110' : 'border-slate-300 bg-transparent hover:bg-slate-100 hover:border-slate-400'}`}
                    title="Neutral markieren (Grauer Rahmen)"
                />

                {/* 2. YELLOW MARKER (Yellow Vertical Box - Character Highlight) */}
                <div className="w-14 flex justify-end">
                    <button
                        onClick={() => onSetActiveColor('yellow')}
                        className={`w-[19px] h-[27px] rounded-sm transition-all ${activeColor === 'yellow' ? 'bg-[#feffc7] border-2 border-slate-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50 scale-110' : 'bg-[#feffc7] hover:brightness-95 border-2 border-slate-200'}`}
                        title="Gelb markieren (Buchstaben)"
                    />
                </div>

                {/* 3. COLOR PALETTE (Edge-to-Edge Staggered) */}
                <div className="flex justify-center gap-0 w-full">
                    {/* Left Column (Even indices: Blue, Red, Green...) */}
                    <div className="flex flex-col gap-3">
                        {colorPalette.filter((_, i) => i % 2 === 0).map((color, i) => {
                            const originalIndex = i * 2;
                            // Resolve the active palette index if activeColor is 'palette-X'
                            let isActive = false;
                            if (typeof activeColor === 'string' && activeColor.startsWith('palette-')) {
                                const activeIndex = parseInt(activeColor.split('-')[1], 10);
                                if (activeIndex === originalIndex) isActive = true;
                            } else if (activeColor === color) {
                                isActive = true;
                            }

                            return (
                                <button
                                    key={originalIndex}
                                    onClick={() => {
                                        if (isActive) {
                                            setEditingColorIndex(originalIndex);
                                        } else {
                                            onSetActiveColor(`palette-${originalIndex}`);
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 transition-all min-touch-target ${isActive ? 'scale-110 border-slate-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50' : 'border-transparent hover:scale-105 shadow-sm'}`}
                                    style={{ backgroundColor: color }}
                                    title="Klicken zum Auswählen, erneut klicken zum Ändern"
                                />
                            );
                        })}
                    </div>

                    {/* Right Column (Odd indices: Red, Purple...) - Offset & Edge-to-Edge */}
                    <div className="flex flex-col gap-3 mt-6">
                        {colorPalette.filter((_, i) => i % 2 !== 0).map((color, i) => {
                            const originalIndex = i * 2 + 1;
                            // Resolve the active palette index if activeColor is 'palette-X'
                            let isActive = false;
                            if (typeof activeColor === 'string' && activeColor.startsWith('palette-')) {
                                const activeIndex = parseInt(activeColor.split('-')[1], 10);
                                if (activeIndex === originalIndex) isActive = true;
                            } else if (activeColor === color) {
                                isActive = true;
                            }

                            return (
                                <button
                                    key={originalIndex}
                                    onClick={() => {
                                        if (isActive) {
                                            setEditingColorIndex(originalIndex);
                                        } else {
                                            onSetActiveColor(`palette-${originalIndex}`);
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 transition-all min-touch-target ${isActive ? 'scale-110 border-slate-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50' : 'border-transparent hover:scale-105 shadow-sm'}`}
                                    style={{ backgroundColor: color }}
                                    title="Klicken zum Auswählen, erneut klicken zum Ändern"
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Color Picker Popup - Rendered via Portal to escape Toolbar container */}
            {/* User Request: "Rechts am Bildrand in der Nähe der Symbolleiste" */}
            {editingColorIndex !== null && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-[2px] animate-fadeIn"
                    onClick={() => setEditingColorIndex(null)}
                >
                    <div
                        className="absolute right-24 top-24 p-6 bg-white shadow-2xl rounded-3xl border border-slate-200 w-[500px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xl font-black text-slate-800 mb-6 text-center">Farbe wählen</p>
                        <div className="grid grid-cols-5 gap-4 mb-6">
                            {AVAILABLE_COLORS.map(c => (
                                <button
                                    key={c}
                                    className={`w-14 h-14 rounded-full border-4 transition-all shadow-sm ${activeColor === c ? 'border-slate-900 scale-110 shadow-xl' : 'border-slate-100 hover:border-blue-400 hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => {
                                        onUpdatePalette(editingColorIndex, c);
                                        onSetActiveColor(`palette-${editingColorIndex}`); // Keep referencing the slot
                                        setEditingColorIndex(null);
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            className="w-full py-3 text-lg font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95"
                            onClick={() => setEditingColorIndex(null)}
                        >
                            Abbrechen
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <div className="mt-auto flex flex-col gap-4 w-full items-center">
                <ToolbarButton
                    title="Vollbild"
                    icon={isFullscreen ? Icons.Minimize : Icons.Maximize}
                    onClick={onToggleFullscreen}
                    disabled={isReadingMode}
                    activeColor="gray"
                />

                <Separator horizontal={false} />

                {/* --- BOTTOM SECTION: CORRECTION & SETTINGS --- */}
                <ToolbarButton
                    title="Silben korrigieren"
                    icon={Icons.SplitVertical}
                    onClick={() => onToolChange(activeTool === 'split' ? null : 'split')}
                    active={activeTool === 'split'}
                    activeColor="teal"
                    disabled={isReadingMode}
                />

                <ToolbarButton
                    title="Einstellungen"
                    icon={Icons.Settings}
                    onClick={onOpenSettings}
                    disabled={isReadingMode}
                    activeColor="gray"
                />
            </div>
        </div>
    );
};
