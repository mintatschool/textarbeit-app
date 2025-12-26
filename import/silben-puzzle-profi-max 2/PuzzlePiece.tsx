
import React from 'react';
import { PUZZLE_PATH_LEFT, PUZZLE_PATH_RIGHT } from './constants';

interface PuzzlePieceProps {
  label: string;
  type: 'left' | 'right';
  colorClass: string;
  onDragStart?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  scale?: number;
  style?: React.CSSProperties;
  className?: string;
  isGhost?: boolean; 
  showSeamLine?: boolean;
}

const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ 
  label, 
  type, 
  colorClass, 
  onDragStart, 
  isDragging, 
  scale = 1,
  style, 
  className,
  isGhost = false,
  showSeamLine = false
}) => {
  const svgWidth = 220;
  const svgHeight = 130;
  const baseWidth = 200;
  const baseHeight = 110;
  
  const effectiveScale = isGhost ? scale * 1.05 : scale;
  const path = type === 'left' ? PUZZLE_PATH_LEFT : PUZZLE_PATH_RIGHT;

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && !isGhost) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/puzzle-piece", label);
      onDragStart(e);
    }
  };

  const calculateFontSize = () => {
    const baseSize = 2.4; 
    const lengthFactor = label.length > 5 ? 0.6 : label.length > 3 ? 0.8 : 1.0;
    return `${baseSize * lengthFactor}rem`;
  };

  const getHexColor = (twClass: string) => {
    if (isGhost) return '#E6EEF8'; 
    const colorMap: Record<string, string> = {
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

  return (
    <div
      className={`${className} flex items-center justify-center transition-all duration-300 select-none overflow-visible`}
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
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={`absolute inset-0 -translate-x-2 -translate-y-2 overflow-visible ${!isGhost ? 'drop-shadow-xl' : ''}`}
        >
          <path 
            d={path}
            fill={getHexColor(colorClass)}
            stroke={isGhost ? '#cbd5e1' : 'rgba(255,255,255,0.7)'}
            strokeWidth={isGhost ? "2" : "3"}
            strokeDasharray="0"
            strokeLinejoin="round"
          />
          
          {showSeamLine && !isGhost && (
            <path 
              d={path}
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="2"
              className="pointer-events-none"
            />
          )}
        </svg>

        {!isGhost && (
          <span className={`
            relative z-10 pointer-events-none select-none font-black text-white text-center block w-full px-2
            ${type === 'left' ? 'pr-16' : 'pl-9'}
          `}
          style={{ 
            fontSize: calculateFontSize(),
            textShadow: '0 2px 5px rgba(0,0,0,0.4)',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default PuzzlePiece;
