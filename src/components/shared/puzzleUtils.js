/**
 * Shared utility functions for puzzle exercises.
 * Extracted to reduce code duplication.
 */

/**
 * Resolves piece color based on activeColor and fallback.
 * Used by TwoPartPuzzleLayout, PuzzleTestMultiSyllableView, SyllableCompositionExtensionView.
 * 
 * @param {string} pieceColor - Original color of the piece
 * @param {string} activeColor - Currently active color from context
 * @returns {string} - Tailwind color class
 */
export const getPieceColor = (pieceColor, activeColor) => {
    if (activeColor === 'neutral') return 'bg-blue-500'; // Default to blue
    if (activeColor && activeColor !== 'neutral') return activeColor;
    return pieceColor || 'bg-blue-500';
};

/**
 * Determines text padding based on puzzle piece type.
 * Used by PuzzleTestPiece to center text visually in the "body" excluding knobs.
 * 
 * @param {string} type - Piece type ('left', 'right', 'middle', 'zigzag-left', 'zigzag-right', 'zigzag-middle')
 * @returns {string} - Tailwind padding classes
 */
export const getTextPadding = (type) => {
    // Start pieces (Knob/Arrow on Right) -> Need Padding Right to shift text Left
    if (type === 'left' || type === 'zigzag-left') return 'pr-20';

    // End pieces (Hole/Arrow-In on Left) -> Need Padding Left to shift text Right
    if (type === 'right' || type === 'zigzag-right') return 'pr-10';

    // Middle pieces (Hole Left, Knob Right) -> Shift left
    if (type === 'middle' || type === 'zigzag-middle') return 'pr-14';

    return 'pr-4 pl-1';
};
