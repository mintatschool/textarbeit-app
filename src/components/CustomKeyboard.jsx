import React, { useState } from 'react';
import { Icons } from './Icons';

export const CustomKeyboard = ({ onKeyPress, onBackspace, onEnter, settings, activeKey }) => {
    // Standard QWERTZ Layout
    // Lowercase by default as requested
    const rows = [
        ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
        ['y', 'x', 'c', 'v', 'b', 'n', 'm']
    ];

    const [isShifted, setIsShifted] = useState(false);
    // Optional: Caps Lock state if double tap logic is needed, but sticking to simple shift for now.

    const handleKeyPress = (char) => {
        // Apply Shift if active
        const finalChar = isShifted ? char.toUpperCase() : char;
        onKeyPress(finalChar);

        // Auto-disable shift after one character (standard touch behavior)
        if (isShifted) {
            setIsShifted(false);
        }
    };

    const toggleShift = () => {
        setIsShifted(!isShifted);
    };

    const baseKeyClass = "flex-1 border-b-2 rounded-lg shadow-sm transition-all flex items-center justify-center font-bold text-slate-700 select-none text-[1.6rem] sm:text-4xl h-[60px] sm:h-[68px] touch-manipulation";
    const baseSpecialKeyClass = "flex items-center justify-center border-b-2 rounded-lg shadow-sm transition-all h-[60px] sm:h-[68px] touch-manipulation text-slate-600";
    const actionKeyClass = "flex items-center justify-center bg-blue-500 border-b-2 border-blue-600 rounded-lg shadow-sm active:bg-blue-600 active:border-b-0 active:translate-y-[2px] transition-all h-[60px] sm:h-[68px] touch-manipulation text-white";

    // Helper to check if a key is active
    const isKeyActive = (char) => {
        if (!activeKey) return false;
        return activeKey.toLowerCase() === char.toLowerCase();
    };

    const keyWidthNum = 8.5; // vw base
    const keyWidth = `clamp(42px, ${keyWidthNum}vw, 60px)`;
    const gapWidth = `calc(${keyWidth} * 0.25)`;

    // Spacers and Widths for Hardware-like Alignment
    const row0Offset = `calc(${keyWidth} * 2.0)`;
    const row1Offset = `calc(${keyWidth} * 2.5)`;
    const row2Offset = `calc(${keyWidth} * 0.0)`;

    const backspaceWidth = `calc(${keyWidth} * 1.5)`;
    const weiterWidth = `calc(${keyWidth} * 2.0)`;
    const shiftLeftWidth = `calc(${keyWidth} * 2.75)`;
    // Right Shift spans 'ö' and 'ä' plus the gap between them (approx 4px)
    const shiftRightWidth = `calc(${keyWidth} * 2.0 + 0.25rem)`;
    // Gap after 'm' to align Right Shift under 'ö' and 'ä'
    // Target Start (Ö) = 2.5(Offset) + 9(Keys) = 11.5 KW
    // M End (Row 2 Start 0.0) = 2.75(LShift) + 0.25(Gap) + 7(Keys) = 10.0 KW
    // Gap Needed = 1.5 KW + gap accumulation correction
    const shiftRightGap = `calc(${keyWidth} * 1.5 + 0.75rem)`;

    return (
        <div className="w-full pt-1 pb-4 sm:pt-2 sm:pb-2 flex flex-col items-center select-none safe-area-bottom overflow-x-auto">
            <div className="flex flex-col gap-2 w-fit px-4">
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center w-full">

                        {/* Row Offsets */}
                        {rowIndex === 0 && <div style={{ width: row0Offset }} />}
                        {rowIndex === 1 && <div style={{ width: row1Offset }} />}
                        {rowIndex === 2 && <div style={{ width: row2Offset }} />}

                        {/* Shift Key on Left of Bottom Row */}
                        {rowIndex === 2 && (
                            <>
                                <button
                                    onClick={toggleShift}
                                    className={`${baseSpecialKeyClass} ${isShifted
                                        ? 'bg-white text-blue-600 border-blue-400'
                                        : activeKey === 'Shift'
                                            ? 'bg-slate-300 border-slate-400 translate-y-[2px] border-b-0'
                                            : 'bg-slate-200 border-slate-300 active:bg-slate-300 active:border-b-0 active:translate-y-[2px]'
                                        }`}
                                    style={{ width: shiftLeftWidth, flex: '0 0 auto' }}
                                >
                                    {isShifted ? <Icons.ArrowUp size={24} strokeWidth={3} /> : <Icons.ArrowUp size={24} />}
                                </button>
                                <div style={{ width: gapWidth }} />
                            </>
                        )}

                        <div className="flex gap-1">
                            {row.map((char) => {
                                const active = isKeyActive(char);
                                return (
                                    <button
                                        key={char}
                                        onClick={() => handleKeyPress(char)}
                                        className={`${baseKeyClass} ${active
                                            ? 'bg-blue-100 border-slate-200 border-b-0 translate-y-[2px]'
                                            : 'bg-white border-slate-300 active:bg-blue-100 active:border-b-0 active:translate-y-[2px]'
                                            }`}
                                        style={{
                                            fontFamily: settings?.fontFamily || 'inherit',
                                            flex: '0 0 auto',
                                            width: keyWidth
                                        }}
                                    >
                                        {isShifted ? char.toUpperCase() : char}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Backspace on Right of Top Row - with ß centered before it */}
                        {rowIndex === 0 && (
                            <>
                                <div className="flex-1" />
                                <button
                                    onClick={() => handleKeyPress('ß')}
                                    className={`${baseKeyClass} ${isKeyActive('ß')
                                        ? 'bg-blue-100 border-slate-200 border-b-0 translate-y-[2px]'
                                        : 'bg-white border-slate-300 active:bg-blue-100 active:border-b-0 active:translate-y-[2px]'
                                        }`}
                                    style={{
                                        fontFamily: settings?.fontFamily || 'inherit',
                                        flex: '0 0 auto',
                                        width: keyWidth
                                    }}
                                >
                                    {isShifted ? 'ẞ' : 'ß'}
                                </button>
                                <div className="flex-1" />
                                <button
                                    onClick={onBackspace}
                                    className={`${baseSpecialKeyClass} ${activeKey === 'Backspace'
                                        ? 'bg-red-200 border-red-300 translate-y-[2px] border-b-0'
                                        : 'bg-red-50 border-red-200 text-red-500 active:bg-red-100 active:border-b-0 active:translate-y-[2px]'
                                        }`}
                                    style={{ width: backspaceWidth, flex: '0 0 auto' }}
                                >
                                    <Icons.Delete size={28} />
                                </button>
                            </>
                        )}

                        {/* Weiter on Row 1 */}
                        {rowIndex === 1 && (
                            <button
                                onClick={onEnter}
                                className={`${actionKeyClass} ml-auto font-bold text-lg sm:text-xl gap-2 ${activeKey === 'Enter' ? 'bg-blue-600 border-b-0 translate-y-[2px]' : ''
                                    }`}
                                style={{ width: weiterWidth, flex: '0 0 auto' }}
                            >
                                Weiter <Icons.ArrowRight size={24} />
                            </button>
                        )}

                        {/* Right Shift Key on Bottom Row */}
                        {rowIndex === 2 && (
                            <>
                                <div style={{ width: shiftRightGap }} />
                                <button
                                    onClick={toggleShift}
                                    className={`${baseSpecialKeyClass} ${isShifted
                                        ? 'bg-white text-blue-600 border-blue-400'
                                        : activeKey === 'Shift'
                                            ? 'bg-blue-100 border-slate-400 translate-y-[2px] border-b-0'
                                            : 'bg-slate-200 border-slate-300 active:bg-blue-100 active:border-b-0 active:translate-y-[2px]'
                                        }`}
                                    style={{ width: shiftRightWidth, flex: '0 0 auto' }}
                                >
                                    {isShifted ? <Icons.ArrowUp size={24} strokeWidth={3} /> : <Icons.ArrowUp size={24} />}
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
