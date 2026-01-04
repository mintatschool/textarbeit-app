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
    let baseClass = "p-3 rounded-xl transition flex-shrink-0 min-touch-target";
    if (className) {
        if (!className.includes('rounded-')) {
            baseClass = `p-2 rounded-xl transition flex-shrink-0 min-touch-target ${className}`;
        } else {
            baseClass = `p-2 transition flex-shrink-0 min-touch-target ${className}`;
        }
    }
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
    onBatchHide,
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
    setShowFindLetters,    // New: Find letters exercise


    // Color Props
    colorPalette = [],
    activeColor,
    onSetActiveColor,
    onUpdatePalette,
    settings,
    onMarkAllNeutral, // New prop
    isGrouping,
    onToggleGrouping,
    hideYellowLetters,
    onToggleHideLetters
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
            {/* --- SECTION 1: SYSTEM & GENERAL TOOLS ("Control Room") --- */}
            <div className="flex flex-col gap-3 items-center p-1 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner w-full">
                <ToolbarButton
                    title="Zurück zur Eingabe"
                    icon={Icons.Edit2}
                    onClick={onToggleView}
                    active={false}
                    className="w-14 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400"
                />

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
                    className="w-14 h-10 rounded-2xl"
                />

                <ToolbarButton
                    title={showMarkAllConfirm ? "Bist du sicher?" : "Alles markieren (grauer Kasten)"}
                    icon={showMarkAllConfirm ? Icons.Check : Icons.MarkAll}
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
                    className="w-14 h-10 rounded-2xl"
                />
            </div>

            {/* --- SECTION 4: MARKING SYSTEM --- */}
            <div className="flex flex-col gap-3 items-center p-1 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner w-full">

                <div className="flex gap-0.5 items-center justify-end w-full px-0">
                    {/* 1. NEUTRAL MARKER (Grey Box - Whole Word Frame) */}
                    <button
                        onClick={() => onSetActiveColor('neutral')}
                        className={`w-8 h-6 flex-shrink-0 rounded-lg border-2 transition-all !min-h-0 ${activeColor === 'neutral' ? 'border-slate-500 bg-slate-200 shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50 scale-110' : 'border-slate-500 bg-transparent hover:bg-slate-100 hover:border-slate-600'}`}
                        title="Neutral markieren (Grauer Rahmen)"
                    />

                    {/* 1b. GHOST BUTTON (Hide words - only if marked) */}
                    <button
                        onClick={() => {
                            // If tool is already active, we want to TOGGLE batch visibility (handled in App.jsx via onBatchHide)
                            // Wait, if tool is active, clicking again usually deactivates tool (onToolChange(null)).
                            // User request: "beim erneuten drücken des symbols wieder freigelegt werden"
                            // If tool IS active, clicking SHOULD call onBatchHide again (which toggles) AND keep tool active?
                            // OR toggles tool off?
                            // "Es sollen die versteckten wörter aber auch beim erneuten drücken des symbols wieder freigelegt werden" implies using the button as a toggle for *visibility*.
                            // But it is also a *tool selector*.

                            // Let's call onBatchHide ALWAYS.
                            // And toggle tool state?
                            // If we want to stay in "hiding mode" (allows individual clicking), we should ensure tool is active.
                            // But maybe user just wants the batch effect.
                            // If tool is NOT active -> Activate it + Batch Hide.
                            // If tool IS active -> Batch Unhide? But also Deactivate tool? 
                            // Standard behavior for toolbar buttons is: Active -> Click -> Inactive.

                            // Let's do:
                            // Click -> Call Batch Toggle (Hide/Unhide)
                            // Toggle Tool State (Active/Inactive)
                            onToolChange(activeTool === 'blur' ? null : 'blur');
                        }}
                        className={`p-1 rounded-xl transition flex-shrink-0 ${activeTool === 'blur' ? 'bg-gray-600 text-white shadow-lg' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'} ${isReadingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Wörter verstecken"
                        disabled={isReadingMode}
                    >
                        <Icons.Ghost size={24} />
                    </button>
                </div>

                {/* 2. YELLOW MARKER BLOCK */}
                <div className="flex gap-0.5 items-center justify-end w-full px-0">
                    <button
                        onClick={() => onSetActiveColor('yellow')}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border-2 !min-h-0 ${activeColor === 'yellow' ? 'border-slate-500 bg-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/50 scale-110' : 'border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                        title="Gelb markieren (Buchstaben)"
                    >
                        <Icons.LetterMarker size={28} className="text-slate-500" />
                    </button>

                    <button
                        onClick={onToggleHideLetters}
                        className={`p-1 rounded-xl transition flex-shrink-0 ${hideYellowLetters ? 'bg-gray-600 text-white shadow-lg' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'} ${isReadingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Gelbe Buchstaben verstecken"
                        disabled={isReadingMode}
                    >
                        <Icons.Ghost size={24} />
                    </button>
                </div>

                {/* 3. COLOR PALETTE (Edge-to-Edge Staggered) */}
                <div className="flex justify-center w-full mb-2">
                    {/* Left Column (Even indices: Blue, Red, Green...) */}
                    <div className="flex flex-col gap-3 z-10">
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
                    <div className="flex flex-col gap-3 mt-7 -ml-1.5 z-0">
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

                {/* 2b. GROUPING BUTTON (Only visible if a color is active) */}
                {(activeColor && activeColor !== 'yellow') && (
                    <button
                        onClick={onToggleGrouping}
                        className={`w-14 h-10 flex items-center justify-center rounded-xl transition-all min-touch-target mt-1 ${isGrouping ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title={isGrouping ? "Verbinden abschließen" : "Wörter verbinden"}
                    >
                        <Icons.Group size={24} />
                    </button>
                )}
            </div>




            <Separator horizontal={false} />

            {/* --- SECTION 2: DATA VIEW --- */}

            <ToolbarButton
                title="Wortliste/Tabelle"
                icon={Icons.List}
                onClick={() => setShowList(true)}
                disabled={isReadingMode}
                activeColor="purple"
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 hover:border-purple-300 rounded-xl"
            />

            <Separator horizontal={false} />

            {/* --- SECTION 3: EXERCISE MENUS --- */}
            <MenuDropdown
                title="Buchstaben"
                icon={<Icons.LetterSearch size={24} />}
                labelVisible={false}
                align="right"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:border-blue-300 rounded-xl"
            >
                <MenuItem onClick={() => setShowFindLetters(true)} icon={<Icons.LetterSearch size={20} className="text-blue-600" />}>
                    Buchstaben finden
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: SILBEN */}
            <MenuDropdown
                title="Silben"
                icon={<Icons.MenuSyllables size={24} />}
                labelVisible={false}
                align="right"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:border-blue-300 rounded-xl"
            >
                <MenuItem onClick={() => setShowCarpet(true)} icon={<Icons.Grid2x2 size={20} className="text-indigo-600" />}>
                    Silbenteppich
                </MenuItem>
                <MenuItem onClick={() => setShowSyllableComposition(true)} icon={<Icons.SyllableBuild1 size={20} className="text-pink-500" />}>
                    Silbenbau 1
                </MenuItem>
                <MenuItem onClick={() => setShowSyllableExtension(true)} icon={<Icons.SyllableBuild2 size={20} className="text-purple-500" />}>
                    Silbenbau 2
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: WÖRTER */}
            <MenuDropdown
                title="Wörter"
                icon={<Icons.MenuWords size={24} />}
                labelVisible={false}
                align="right"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:border-blue-300 rounded-xl"
            >
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
                    Wortwolke
                </MenuItem>
                <MenuItem onClick={() => setShowSplitExercise(true)} icon={<Icons.Scissors size={20} className="text-orange-500 -rotate-90" />}>
                    Wörter trennen
                </MenuItem>
                <MenuItem onClick={() => setShowPuzzleTestTwo(true)} icon={<Icons.SyllableTestTwo size={20} className="text-blue-500" />}>
                    Silbenpuzzle 1
                </MenuItem>
                <MenuItem onClick={() => setShowPuzzleTestMulti(true)} icon={<Icons.SyllableTestMulti size={20} className="text-blue-500" />}>
                    Silbenpuzzle 2
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
            <MenuDropdown
                title="Sätze"
                icon={<Icons.MenuSentenceCategory size={24} />}
                labelVisible={false}
                align="right"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:border-blue-300 rounded-xl"
            >
                <MenuItem onClick={() => setShowSentenceShuffle(true)} icon={<Icons.Shuffle size={20} className="text-purple-500" />}>
                    Schüttelsätze
                </MenuItem>
                <MenuItem onClick={() => setShowGapSentences(true)} icon={<Icons.GapSentences size={20} className="text-indigo-500" />}>
                    Lückensätze
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: TEXT */}
            <MenuDropdown
                title="Text"
                icon={<Icons.TextParagraph size={24} />}
                labelVisible={false}
                align="right"
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:border-blue-300 rounded-xl"
            >
                <MenuItem onClick={() => setShowSentencePuzzle(true)} icon={<Icons.Sentence size={20} className="text-pink-500" />}>
                    Satzpuzzle
                </MenuItem>
                <MenuItem onClick={() => setShowTextPuzzle(true)} icon={<Icons.TextBlocks size={20} className="text-emerald-500" />}>
                    Textpuzzle
                </MenuItem>
                <MenuItem onClick={() => setShowCaseExercise(true)} icon={<Icons.Capitalization size={20} className="text-blue-600" />}>
                    Groß-/Kleinschreibung
                </MenuItem>
            </MenuDropdown>


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
                <Separator horizontal={false} />

                <ToolbarButton
                    title="Silben korrigieren"
                    icon={Icons.SplitVertical}
                    onClick={() => onToolChange(activeTool === 'split' ? null : 'split')}
                    active={activeTool === 'split'}
                    activeColor="teal"
                    disabled={isReadingMode}
                />

                <ToolbarButton
                    title="Lesemodus"
                    icon={Icons.Hand}
                    onClick={onToggleReadingMode}
                    active={isReadingMode}
                    activeColor="orange"
                />

                {/* --- SECTION 5: GLOBAL UTILITIES --- */}
                <ToolbarButton
                    title="Vollbild"
                    icon={isFullscreen ? Icons.Minimize : Icons.Maximize}
                    onClick={onToggleFullscreen}
                    disabled={isReadingMode}
                    activeColor="gray"
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
