import React from 'react';
import { Icons } from './Icons';
import { MenuDropdown, MenuItem } from './MenuDropdown';

const Separator = ({ horizontal = false }) => (
    horizontal
        ? <div className="w-px h-8 bg-slate-300 mx-1 flex-shrink-0"></div>
        : <div className="w-8 h-px bg-slate-300 my-1 flex-shrink-0 min-h-[1px]"></div>
);

const ToolbarButton = ({ onClick, icon: IconComponent, title, active, activeColor = "blue", disabled }) => {
    let baseClass = "p-3 rounded-full transition flex-shrink-0 min-touch-target";
    let activeClass = "";

    if (active) {
        // Farb-Logik basierend auf dem Original-Code
        if (activeColor === "orange") activeClass = "bg-orange-500 text-white shadow-lg";
        else if (activeColor === "teal") activeClass = "bg-teal-600 text-white shadow-lg";
        else if (activeColor === "gray") activeClass = "bg-gray-600 text-white shadow-lg";
        else activeClass = "bg-blue-600 text-white shadow-md"; // Default Edit Mode Button
    } else {
        // Hover-Farben
        if (activeColor === "orange") activeClass = "text-slate-600 hover:text-orange-600 hover:bg-orange-50";
        else if (activeColor === "teal") activeClass = "text-slate-600 hover:text-teal-600 hover:bg-teal-50";
        else if (activeColor === "gray") activeClass = "text-slate-600 hover:text-gray-600 hover:bg-gray-50";
        else if (activeColor === "red") activeClass = "text-slate-600 hover:text-red-600 hover:bg-red-50";
        else if (activeColor === "purple") activeClass = "text-slate-600 hover:text-purple-600 hover:bg-purple-50";
        else activeClass = "text-slate-600 hover:text-blue-600 hover:bg-blue-50";
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
    setShowSplitExercise,
    setShowSentencePuzzle, // Needs logic for 'text' vs 'sentence' mode inside parent
    setShowTextPuzzle,     // Separate prop for text puzzle
    setShowSentenceShuffle, // New: Word shuffle within sentences
    setShowGapWords,       // New: Missing letters exercise
    setShowGapSentences,   // New: Missing words in sentences
}) => {

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
            />

            <ToolbarButton
                title="Alle Markierungen löschen"
                icon={Icons.RotateCcw}
                onClick={onResetHighlights}
                disabled={isReadingMode}
                activeColor="red"
            />

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
                <MenuItem onClick={() => setShowCarpet(true)}>
                    <Icons.Grid2x2 size={20} className="text-indigo-600" /> Silbenteppich
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: WÖRTER */}
            <MenuDropdown title="Wörter" icon={<Icons.MenuWords size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowPuzzle(true)}>
                    <Icons.Puzzle size={20} className="text-purple-600" /> Silbenpuzzle
                </MenuItem>
                <MenuItem onClick={() => setShowStaircase(true)}>
                    <Icons.Stairs size={20} className="text-indigo-600" /> Treppenwörter
                </MenuItem>
                <MenuItem onClick={() => setShowCloud(true)}>
                    <Icons.Cloud size={20} className="text-blue-500" /> Schüttelwörter
                </MenuItem>
                <MenuItem onClick={() => setShowSplitExercise(true)}>
                    <Icons.Scissors size={20} className="text-orange-500 -rotate-90" /> Wörter trennen
                </MenuItem>
                <MenuItem onClick={() => setShowGapWords(true)}>
                    <Icons.GapWords size={20} className="text-blue-600" /> Lückenwörter
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: SÄTZE */}
            <MenuDropdown title="Sätze" icon={<Icons.MenuSentenceCategory size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowSentenceShuffle(true)}>
                    <Icons.Shuffle size={20} className="text-purple-500" /> Schüttelsätze
                </MenuItem>
                <MenuItem onClick={() => setShowGapSentences(true)}>
                    <Icons.GapSentences size={20} className="text-indigo-500" /> Lückensätze
                </MenuItem>
            </MenuDropdown>

            {/* MENÜ: TEXT */}
            <MenuDropdown title="Text" icon={<Icons.TextParagraph size={24} />} labelVisible={false} align="right">
                <MenuItem onClick={() => setShowSentencePuzzle(true)}>
                    <Icons.Sentence size={20} className="text-pink-500" /> Satzpuzzle
                </MenuItem>
                <MenuItem onClick={() => setShowTextPuzzle(true)}>
                    <Icons.TextBlocks size={20} className="text-emerald-500" /> Textpuzzle
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
