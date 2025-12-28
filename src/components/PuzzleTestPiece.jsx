import React from 'react';
import { PUZZLE_PATH_LEFT, PUZZLE_PATH_RIGHT, PUZZLE_PATH_MIDDLE, PUZZLE_PATH_ZIGZAG_LEFT, PUZZLE_PATH_ZIGZAG_RIGHT, PUZZLE_PATH_ZIGZAG_MIDDLE } from './puzzleConstants';

const PuzzleTestPiece = ({
    id,
    label,
    type,
    colorClass,
    onDragStart,
    isDragging,
    scale = 1,
    style,
    className,
    isGhost = false,
    showSeamLine = false,
    dynamicWidth = null,
    fontFamily
}) => {
    // Determine base width
    const standardBaseWidth = 200;
    const calculateDynamicWidth = () => {
        if (dynamicWidth) return dynamicWidth;
        if (label && label.length > 5) {
            return standardBaseWidth + ((label.length - 5) * 20);
        }
        return standardBaseWidth;
    };

    const baseWidth = calculateDynamicWidth();
    const baseHeight = 110;

    // Stretch factor for SVG
    const stretchX = baseWidth / standardBaseWidth;

    const svgWidth = 220;
    const svgHeight = 130;

    const effectiveScale = isGhost ? scale * 1.05 : scale;
    let path = PUZZLE_PATH_LEFT;
    if (type === 'right') path = PUZZLE_PATH_RIGHT;
    if (type === 'middle') path = PUZZLE_PATH_MIDDLE;
    if (type === 'zigzag-left') path = PUZZLE_PATH_ZIGZAG_LEFT;
    if (type === 'zigzag-right') path = PUZZLE_PATH_ZIGZAG_RIGHT;
    if (type === 'zigzag-middle') path = PUZZLE_PATH_ZIGZAG_MIDDLE;

    const handleDragStart = (e) => {
        if (onDragStart && !isGhost) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("application/puzzle-piece", label);
            e.dataTransfer.setData("application/puzzle-piece-id", id);
            e.dataTransfer.setData("application/puzzle-type", type);
            onDragStart(e);
        }
    };

    const calculateFontSize = () => {
        const len = label.length;
        if (len > 12) return '1.3rem';
        if (len > 10) return '1.5rem';
        if (len > 8) return '1.8rem';
        if (len > 6) return '2.2rem';
        if (len > 4) return '2.5rem';
        if (len > 2) return '3.0rem';
        return '3.5rem';
    };

    const getHexColor = (twClass) => {
        if (isGhost) return '#F1F5F9'; // Very light slate for background
        const colorMap = {
            'bg-blue-500': '#3b82f6',
            'bg-pink-500': '#ec4899',
            'bg-emerald-500': '#10b981',
            'bg-orange-500': '#f97316',
            'bg-purple-500': '#a855f7',
            'bg-amber-500': '#f59e0b',
            'bg-rose-500': '#f43f5e'
        };
        return colorMap[twClass] || '#3b82f6';
    };

    // Determine padding to center text visually in the "body" excluding knobs
    const getTextPadding = () => {
        // Start pieces (Knob/Arrow on Right) -> Need Padding Right to shift text Left
        if (type === 'left' || type === 'zigzag-left') return 'pr-8';

        // End pieces (Hole/Arrow-In on Left) -> Need Padding Left to shift text Right
        if (type === 'right' || type === 'zigzag-right') return 'pl-8';

        if (type === 'zigzag-middle') return 'px-2';
        return 'px-2';
    };

    return (
        <div
            className={`${className || ''} flex items-center justify-center transition-all duration-300 select-none overflow-visible`}
            style={{
                width: `${baseWidth * effectiveScale}px`,
                height: `${baseHeight * effectiveScale}px`,
                ...style
            }}
        >
            <div
                draggable={!!onDragStart && !isGhost}
                onDragStart={handleDragStart}
                className={`
          relative flex items-center justify-center overflow-visible
          ${isDragging ? 'opacity-20 scale-95' : 'opacity-100'}
          ${onDragStart && !isGhost ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
                style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'center center'
                }}
            >
                {/* SVG Container */}
                <div
                    className="absolute inset-0 flex items-center justify-center overflow-visible"
                    style={{
                        transform: `scaleX(${stretchX})`,
                        transformOrigin: 'center center'
                    }}
                >
                    <svg
                        width={svgWidth}
                        height={svgHeight}
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className={`overflow-visible -translate-x-2 -translate-y-2 ${!isGhost ? 'drop-shadow-xl' : ''}`}
                        preserveAspectRatio="none"
                    >
                        <path
                            d={path}
                            fill={getHexColor(colorClass)}
                            stroke={isGhost ? '#64748b' : 'rgba(255,255,255,0.7)'}
                            strokeWidth={isGhost ? "4" : (3 / stretchX)}
                            strokeOpacity="1"
                            strokeDasharray="0"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />

                        {showSeamLine && !isGhost && (
                            <path
                                d={path}
                                fill="none"
                                stroke="rgba(0,0,0,0.15)"
                                strokeWidth="2"
                                className="pointer-events-none"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>
                </div>

                {!isGhost && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${getTextPadding()}`}>
                        <span className="select-none font-black text-white text-center block w-full"
                            style={{
                                fontSize: calculateFontSize(),
                                fontFamily: fontFamily,
                                textShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                maxWidth: '100%',
                                whiteSpace: 'nowrap',
                            }}>
                            {label}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PuzzleTestPiece;
