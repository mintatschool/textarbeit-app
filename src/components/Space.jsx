import React from 'react';

export const Space = React.memo(({ id, content, index, color, onMouseDown, onMouseEnter, isTextMarkerMode, isReadingMode, wordSpacing = 0, fontSize, colorPalette, letterSpacing = 0, lineHeight = 1.4, isHeadline }) => {
    // Helper to resolve color palette indices
    const resolveColor = (colorCode) => {
        if (!colorCode) return 'transparent';
        if (colorCode === 'yellow') return 'yellow';
        if (typeof colorCode === 'string' && colorCode.startsWith('palette-')) {
            const idx = parseInt(colorCode.split('-')[1], 10);
            return (colorPalette && colorPalette[idx]) || 'transparent';
        }
        return colorCode;
    };

    const resolvedColor = resolveColor(color);
    const isMarked = resolvedColor && resolvedColor !== 'transparent';
    const showMarkerLayout = isTextMarkerMode || isMarked;
    const touchClass = isTextMarkerMode ? 'touch-none' : '';

    return (
        <span
            data-paint-index={index}
            onMouseDown={(e) => { e.preventDefault(); if (onMouseDown) onMouseDown(index, e); }}
            onMouseEnter={(e) => { if (onMouseEnter) onMouseEnter(index, e); }}
            onPointerEnter={(e) => { if (onMouseEnter && (e.buttons === 1 || e.pointerType === 'touch')) onMouseEnter(index, e); }}
            className={`select-none inline-block whitespace-pre transition-colors duration-200 pointer-events-auto ${isReadingMode ? 'cursor-default' : (showMarkerLayout ? 'cursor-text' : 'cursor-default')} ${touchClass}`}
            style={{
                backgroundColor: resolvedColor,
                paddingRight: (showMarkerLayout && wordSpacing >= 0) ? `${wordSpacing}em` : '0px',
                paddingTop: '0em',
                paddingBottom: '0.10em',
                lineHeight: 1.1,
                fontSize: fontSize ? `${fontSize}px` : 'inherit',
                letterSpacing: `${letterSpacing}em`,
                verticalAlign: 'baseline',
                marginRight: (showMarkerLayout && wordSpacing < 0) ? `${wordSpacing}em` : '0px',
                marginTop: '-0.25em',
                marginBottom: '-0.10em',
                fontWeight: isHeadline ? 'bold' : 'normal',
            }}
        >
            {content}
        </span>
    );
}, (prev, next) => {
    return prev.color === next.color && prev.content === next.content && prev.index === next.index && prev.wordSpacing === next.wordSpacing && prev.fontSize === next.fontSize && prev.isTextMarkerMode === next.isTextMarkerMode && prev.colorPalette === next.colorPalette && prev.isReadingMode === next.isReadingMode && prev.letterSpacing === next.letterSpacing && prev.lineHeight === next.lineHeight && prev.isHeadline === next.isHeadline;
});
