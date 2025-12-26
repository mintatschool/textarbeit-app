export const PUZZLE_PATH_LEFT = 'M 0,10 Q 0,0 10,0 H 130 Q 140,0 140,10 V 35 C 165,30 165,80 140,75 V 100 Q 140,110 130,110 H 10 Q 0,110 0,100 Z';
export const PUZZLE_PATH_MIDDLE = 'M 20,10 Q 20,0 30,0 H 150 Q 160,0 160,10 V 35 C 185,30 185,80 160,75 V 100 Q 160,110 150,110 H 30 Q 20,110 20,100 V 75 C 45,80 45,30 20,35 Z';
export const PUZZLE_PATH_RIGHT = 'M 20,10 Q 20,0 30,0 H 190 Q 200,0 200,10 V 100 Q 200,110 190,110 H 30 Q 20,110 20,100 V 75 C 45,80 45,30 20,35 Z';

export const COLORS = [
    'bg-blue-500',
    'bg-pink-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500'
];

// Arrow/Chevron Line Definition (Reusing ZIGZAG names to minimize refactor)
// Height 110.
// Left Piece: Point outwards (Chevron pointing right)
// Right Piece: Indent inwards (Chevron pointing right)

// Left Piece: M 0,10 ... H 140 L 170,55 L 140,110 ...
export const PUZZLE_PATH_ZIGZAG_LEFT = 'M 0,10 Q 0,0 10,0 H 140 L 170,55 L 140,110 H 10 Q 0,110 0,100 Z';

// Right Piece: M 30,0 L 60,55 L 30,110 ...
// Starts at x=30 (to allow overlap/nesting).
// Left edge is L(60,55) L(30,110).
export const PUZZLE_PATH_ZIGZAG_RIGHT = 'M 30,0 L 60,55 L 30,110 H 200 Q 220,110 220,100 V 10 Q 220,0 200,0 H 30 Z';

// Middle Piece: Connects Zigzag Left (hole) to Zigzag Right (point)
// Left side: Matches Zigzag Right's left side (indent/hole) -> M 30,0 L 60,55 L 30,110
// Right side: Matches Zigzag Left's right side (point/knob) -> ... L 200,110 L 230,55 L 200,0 ... (Using width similar to others)
// Path: M 30,0 L 60,55 L 30,110  H 200 L 230,55 L 200,0 H 30 Z
export const PUZZLE_PATH_ZIGZAG_MIDDLE = 'M 30,0 L 60,55 L 30,110 H 170 L 200,55 L 170,0 H 30 Z';
