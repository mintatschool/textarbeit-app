import React from 'react';

const Icon = ({ path, size = 24, className = "", viewBox = "0 0 24 24", ...props }) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className} style={{ transformBox: 'fill-box' }} {...props}>{path}</svg>
);

export const Icons = {
    Edit2: (p) => <Icon {...p} path={<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />} />,
    RotateCcw: (p) => <Icon {...p} path={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>} />,
    RefreshCw: (p) => <Icon {...p} path={<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>} />,
    List: (p) => <Icon {...p} path={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />,
    Table: (p) => <Icon {...p} path={<><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="9" y1="6" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="18" /></>} />,
    SortAsc: (p) => <Icon {...p} viewBox="0 0 800 800" strokeWidth="35" path={<>
        <path d="M 453.27 631.71 C 453.27 631.71 498.99 674.36 528.69 697.19 C 531.87 699.63 534.93 699.38 538.12 696.95 C 564.52 676.81 604.12 639.66 604.12 639.66" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 533.27 654.86 L 533.27 330.76" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 117.60 514.61 L 283.58 114.22 L 448.41 514.82" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 199.90 326.28 L 367.59 324.88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </>} />,
    WordSorting: (p) => <Icon {...p} viewBox="0 0 800 800" strokeWidth="35" path={<>
        <path d="M 187.95 294.87 L 671.17 294.87" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 336.69 180.31 L 336.69 621.54" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 490.43 180.31 L 490.43 621.54" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        {/* Row 1: Col 1, 2, 3 */}
        <path d="M 213.75 244.02 L 293.75 244.02 L 293.75 258.58 L 213.75 258.58 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 373.56 243.70 L 453.56 243.70 L 453.56 258.25 L 373.56 258.25 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 549.29 243.95 L 629.29 243.95 L 629.29 259.05 L 549.29 259.05 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        {/* Row 2: Col 1, 2, 3 */}
        <path d="M 213.75 365.99 L 293.75 365.99 L 293.75 376.46 L 213.75 376.46 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 373.56 367.78 L 453.56 367.78 L 453.56 378.26 L 373.56 378.26 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 549.29 366.14 L 629.29 366.14 L 629.29 376.62 L 549.29 376.62 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        {/* Row 3: Col 3 only */}
        <path d="M 549.29 426.99 L 629.29 426.99 L 629.29 437.46 L 549.29 437.46 Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 203.14 167.48 C 217.69 167.48 220.92 167.48 235.47 167.48 C 250.02 167.48 253.26 167.48 267.81 167.48 C 282.36 167.48 285.59 167.48 300.14 167.48 C 314.69 167.48 317.92 167.48 332.47 167.48 C 347.02 167.48 350.26 167.48 364.81 167.48 C 379.36 167.48 382.59 167.48 397.14 167.48 C 411.69 167.48 414.92 167.48 429.47 167.48 C 444.02 167.48 447.26 167.48 461.81 167.48 C 476.36 167.48 479.59 167.48 494.14 167.48 C 508.69 167.48 511.93 167.48 526.48 167.48 C 541.03 167.48 544.26 167.48 558.81 167.48 C 573.36 167.48 576.59 167.48 591.14 167.48 C 605.69 167.48 608.93 167.48 623.48 167.48 C 638.03 167.48 641.26 167.48 655.81 167.48 C 670.36 167.48 688.14 183.55 688.14 196.70 C 688.14 209.85 688.14 212.77 688.14 225.92 C 688.14 239.07 688.14 241.99 688.14 255.14 C 688.14 268.29 688.14 271.22 688.14 284.37 C 688.14 297.52 688.14 300.44 688.14 313.59 C 688.14 326.74 688.14 329.66 688.14 342.81 C 688.14 355.96 688.14 358.88 688.14 372.03 C 688.14 385.18 688.14 388.11 688.14 401.26 C 688.14 414.41 688.14 417.33 688.14 430.48 C 688.14 443.63 688.14 446.55 688.14 459.70 C 688.14 472.85 688.14 475.77 688.14 488.92 C 688.14 502.07 688.14 505.00 688.14 518.15 C 688.14 531.30 688.14 534.22 688.14 547.37 C 688.14 560.52 688.14 563.44 688.14 576.59 C 688.14 589.74 688.14 592.66 688.14 605.81 C 688.14 618.96 670.36 635.04 655.81 635.04 C 641.26 635.04 638.03 635.04 623.48 635.04 C 608.93 635.04 605.69 635.04 591.14 635.04 C 576.59 635.04 573.36 635.04 558.81 635.04 C 544.26 635.04 541.03 635.04 526.48 635.04 C 511.93 635.04 508.69 635.04 494.14 635.04 C 479.59 635.04 476.36 635.04 461.81 635.04 C 447.26 635.04 444.02 635.04 429.47 635.04 C 414.92 635.04 411.69 635.04 397.14 635.04 C 382.59 635.04 379.36 635.04 364.81 635.04 C 350.26 635.04 347.02 635.04 332.47 635.04 C 317.92 635.04 314.69 635.04 300.14 635.04 C 285.59 635.04 282.36 635.04 267.81 635.04 C 253.26 635.04 250.02 635.04 235.47 635.04 C 220.92 635.04 217.69 635.04 203.14 635.04 C 188.59 635.04 170.80 618.96 170.80 605.81 C 170.80 592.66 170.80 589.74 170.80 576.59 C 170.80 563.44 170.80 560.52 170.80 547.37 C 170.80 534.22 170.80 531.30 170.80 518.15 C 170.80 505.00 170.80 502.07 170.80 488.92 C 170.80 475.77 170.80 472.85 170.80 459.70 C 170.80 446.55 170.80 443.63 170.80 430.48 C 170.80 417.33 170.80 414.41 170.80 401.26 C 170.80 388.11 170.80 385.18 170.80 372.03 C 170.80 358.88 170.80 355.96 170.80 342.81 C 170.80 329.66 170.80 326.74 170.80 313.59 C 170.80 300.44 170.80 297.52 170.80 284.37 C 170.80 271.22 170.80 268.29 170.80 255.14 C 170.80 241.99 170.80 239.07 170.80 225.92 C 170.80 212.77 170.80 209.85 170.80 196.70 C 170.80 183.55 188.59 167.48 203.14 167.48 Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </>} />,

    // Menü-Icons
    MenuSyllables: (p) => <Icon {...p} path={<><line x1="4" y1="12" x2="9" y2="12" strokeWidth="4" /><line x1="15" y1="12" x2="20" y2="12" strokeWidth="4" /></>} />,
    MenuWords: (p) => <Icon {...p} path={<><line x1="4" y1="12" x2="20" y2="12" strokeWidth="4" /></>} />,
    MenuSentences: (p) => <Icon {...p} path={<><line x1="3" y1="8" x2="8" y2="8" strokeWidth="3" /><line x1="10" y1="8" x2="16" y2="8" strokeWidth="3" /><line x1="18" y1="8" x2="21" y2="8" strokeWidth="3" /><line x1="3" y1="16" x2="12" y2="16" strokeWidth="3" /><circle cx="20" cy="16" r="2" fill="currentColor" stroke="none" /></>} />,
    MenuSentenceCategory: (p) => <Icon {...p} path={<><line x1="4" y1="11" x2="16" y2="11" strokeWidth="3" /><line x1="4" y1="16" x2="12" y2="16" strokeWidth="3" /><circle cx="19" cy="16" r="1.5" fill="currentColor" /></>} />,
    TextParagraph: (p) => <Icon {...p} path={<><line x1="4" y1="4" x2="20" y2="4" strokeWidth="2" /><line x1="4" y1="8" x2="20" y2="8" strokeWidth="2" /><line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" /><line x1="4" y1="16" x2="20" y2="16" strokeWidth="2" /><line x1="4" y1="20" x2="12" y2="20" strokeWidth="2" /></>} />,

    // Untermenü-Icons
    Grid2x2: (p) => <Icon {...p} path={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>} />,
    Puzzle: (p) => <Icon {...p} path={<path d="M20.5 11H18V7c0-1.1-.9-2-2-2h-4V3.5C12 2.12 10.88 1 9.5 1S7 2.12 7 3.5V5H3c-1.1 0-2 .9-2 2v4h1.5C3.88 11 5 12.12 5 13.5S3.88 16 2.5 16H1v4c0 1.1.9 2 2 2h4v-1.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5V22h4c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />} />,
    VerbPuzzle: (p) => <Icon {...p} path={<g transform="translate(1, 1) scale(0.9)"><path d="M21.5 12H19V8c0-1.1-.9-2-2-2h-4V4.5C13 3.12 11.88 2 10.5 2S8 3.12 8 4.5V6H4c-1.1 0-2 .9-2 2v4h1.5C4.88 12 6 13.12 6 14.5S4.88 17 3.5 17H2v4c0 1.1.9 2 2 2h4v-1.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5V23h4c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S22.88 12 21.5 12z" strokeWidth="2" /><path d="M9 10l3 3-3 3" strokeWidth="2.5" /><path d="M13 13h3" strokeWidth="2.5" /></g>} />,
    VerbWriting: (p) => <Icon {...p} path={<g transform="translate(1, 1) scale(0.9)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" /><path d="M9 10l3 3-3 3" strokeWidth="2.5" /><path d="M13 13h3" strokeWidth="2.5" /></g>} />,
    Stairs: (p) => <Icon {...p} path={<polyline points="19 5 19 19 5 19 5 15 9 15 9 11 13 11 13 7 19 7" />} />,
    Cloud: (p) => <Icon {...p} path={<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />} />,
    Scissors: (p) => <Icon {...p} path={<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>} />,
    Sentence: (p) => <Icon {...p} path={<><path d="M4 4h16" /><path d="M4 8h10" /><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" /><path d="M4 14h16" /><path d="M4 18h10" /><circle cx="16" cy="18" r="1.5" fill="currentColor" stroke="none" /></>} />,
    TextBlocks: (p) => <Icon {...p} path={<><rect x="4" y="4" width="16" height="7" rx="1" /><rect x="4" y="13" width="16" height="7" rx="1" /></>} />,

    // Tools & Misc
    Ghost: (p) => <Icon {...p} path={<><path d="M9 21h6c3.5 0 4-3 4-6V8c0-3.5-2.5-6-7-6S5 4.5 5 8v7c0 3 .5 6 4 6z" /><path d="M5 21c0 0 1.5-2 3.5-2s3.5 2 3.5 2c0 0 1.5-2 3.5-2s3.5 2 3.5 2" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /></>} />,
    Hand: (p) => <Icon {...p} path={<><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" /><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></>} />,
    Maximize: (p) => <Icon {...p} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></>} />,
    Minimize: (p) => <Icon {...p} path={<><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></>} />,
    SplitVertical: (p) => <Icon {...p} path={<><path d="M3 16a4 4 0 0 0 8 0" strokeWidth="2" /><path d="M13 16a4 4 0 0 0 8 0" strokeWidth="2" /><path d="M12 12 L15 11 L21 5 A 1.42 1.42 0 0 1 19 3 L13 9 Z" strokeWidth="2" /></>} />,
    Settings: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} />,
    QrCode: (p) => <Icon {...p} path={<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>} />,
    Edit3: (p) => <Icon {...p} path={<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />} />,
    Pen: (p) => <Icon {...p} viewBox="0 0 800 800" strokeWidth="60" path={<>
        <path d="M 323.44 389.76 C 323.44 389.76 255.78 458.02 231.84 501.26 C 207.90 544.50 159.03 637.94 186.28 666.69 C 213.53 695.44 318.95 644.28 357.71 618.90 C 396.47 593.52 464.14 528.06 464.14 528.06" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 666.67 400.00 C 666.67 400.00 590.69 476.84 544.10 522.57 C 539.83 526.76 538.72 527.64 533.55 530.66 C 528.38 533.67 527.07 534.23 521.31 535.87 C 515.56 537.51 514.15 537.72 508.17 537.89 C 502.19 538.06 500.77 537.92 494.93 536.61 C 489.10 535.30 487.45 535.35 482.43 532.10 C 472.41 525.62 470.47 523.60 461.93 515.26 C 408.57 463.17 378.90 433.21 329.95 383.26 C 325.77 378.98 325.00 377.76 322.10 372.53 C 319.20 367.29 318.67 365.97 317.16 360.18 C 315.64 354.39 315.46 352.98 315.42 347.00 C 315.39 341.01 315.55 339.60 316.99 333.79 C 318.44 327.98 318.94 326.66 321.78 321.39 C 324.62 316.12 325.32 314.84 329.50 310.56 C 375.09 263.86 452.04 187.96 452.04 187.96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 400.00 133.33 L 503.71 237.04" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
    </>} />,

    // View/Edit Mode
    Eye: (p) => <Icon {...p} path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />,
    Camera: (p) => <Icon {...p} path={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>} />,
    Trash2: (p) => <Icon {...p} path={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>} />,
    ChevronDown: (p) => <Icon {...p} path={<polyline points="6 9 12 15 18 9" />} />,
    ChevronLeft: (p) => <Icon {...p} path={<polyline points="15 18 9 12 15 6" />} />,
    ChevronRight: (p) => <Icon {...p} path={<polyline points="9 18 15 12 9 6" />} />,
    Check: (p) => <Icon {...p} path={<polyline points="20 6 9 17 4 12" />} />,
    X: (p) => <Icon {...p} path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />,
    Download: (p) => <Icon {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />,
    Upload: (p) => <Icon {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>} />,
    Image: (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />,
    Arcs: (p) => <Icon {...p} path={<><path d="M7 16c2-4 5-4 7 0" /><path d="M13 16c2-4 5-4 7 0" /></>} />,
    Printer: (p) => <Icon {...p} path={<><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></>} />,
    Volume2: (p) => <Icon {...p} path={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></>} />,
    VolumeX: (p) => <Icon {...p} path={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></>} />,
    Minus: (p) => <Icon {...p} path={<line x1="5" y1="12" x2="19" y2="12" />} />,
    ChevronsUpDown: (p) => <Icon {...p} path={<><polyline points="7 15 12 20 17 15" /><polyline points="17 9 12 4 7 9" /></>} />,
    Maximize2: (p) => <Icon {...p} path={<><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>} />,
    AlertCircle: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />,
    RotateCcw: (p) => <Icon {...p} path={<><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></>} />,
    Play: (p) => <Icon {...p} path={<><polygon points="5 3 19 12 5 21 5 3"></polygon></>} />,
    Pause: (p) => <Icon {...p} path={<><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>} />,
    Shuffle: (p) => <Icon {...p} path={<><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></>} />,
    Clock: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
    ArrowRight: (p) => <Icon {...p} path={<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>} />,
    HelpCircle: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
    Empty: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>} />,
    Search: (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />,
    Move: (p) => <Icon {...p} path={<><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></>} />,
    MoveVertical: (p) => <Icon {...p} path={<><polyline points="8 18 12 22 16 18" /><polyline points="8 6 12 2 16 6" /><line x1="12" y1="2" x2="12" y2="22" /></>} />,
    AlertTriangle: (p) => <Icon {...p} path={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></>} />,
    Square: (p) => <Icon {...p} path={<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />} />,
    MarkAll: (p) => <Icon {...p} path={<g strokeWidth="1.8"><rect x="2" y="3.5" width="9" height="7.5" rx="2.5" ry="2.5" /><rect x="13" y="3.5" width="9" height="7.5" rx="2.5" ry="2.5" /><rect x="2" y="13" width="9" height="7.5" rx="2.5" ry="2.5" /></g>} />,
    GapWords: (p) => <Icon {...p} path={<><line x1="3" y1="12" x2="9" y2="12" strokeWidth="4" /><line x1="15" y1="12" x2="21" y2="12" strokeWidth="4" /><line x1="9.5" y1="16" x2="14.5" y2="16" strokeWidth="2.5" /></>} />,
    InitialSound: (p) => <Icon {...p} path={<><line x1="8" y1="12" x2="20" y2="12" strokeWidth="4" /><line x1="2" y1="16" x2="6" y2="16" strokeWidth="2.5" /></>} />,
    GapSentences: (p) => <Icon {...p} path={<><line x1="3" y1="7" x2="21" y2="7" strokeWidth="2" /><line x1="3" y1="12" x2="10" y2="12" strokeWidth="2" /><line x1="16" y1="12" x2="21" y2="12" strokeWidth="2" /><line x1="3" y1="17" x2="21" y2="17" strokeWidth="2" /></>} />,
    GapText: (p) => <Icon {...p} path={<><line x1="4" y1="4" x2="20" y2="4" strokeWidth="2" /><line x1="4" y1="8" x2="20" y2="8" strokeWidth="2" /><line x1="4" y1="12" x2="8" y2="12" strokeWidth="2" /><line x1="18" y1="12" x2="20" y2="12" strokeWidth="2" /><line x1="4" y1="16" x2="20" y2="16" strokeWidth="2" /><line x1="4" y1="20" x2="14" y2="20" strokeWidth="2" /></>} />,
    Capitalization: (p) => <Icon {...p} path={<><line x1="4" y1="6" x2="4" y2="20" strokeWidth="4" /><line x1="10" y1="12" x2="10" y2="20" strokeWidth="3.5" /><line x1="16" y1="12" x2="16" y2="20" strokeWidth="3.5" /><line x1="21.5" y1="12" x2="21.5" y2="20" strokeWidth="3.5" /></>} />,
    CheckCircle: (p) => <Icon {...p} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />,

    // Additional Icons for Settings
    Minimize2: (p) => <Icon {...p} path={<><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>} />,
    Maximize2: (p) => <Icon {...p} path={<><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>} />,
    AlignLeft: (p) => <Icon {...p} path={<><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></>} />,
    AlignJustify: (p) => <Icon {...p} path={<><line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></>} />,
    Info: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>} />,
    MagicWand: (p) => <Icon {...p} path={<><path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 5.2l1.4-1.4" /><path d="M2.2 15.8l1.4-1.4" /><path d="M12.2 5.2l-1.4-1.4" /><path d="M7.8 15.8l-1.4-1.4" /><path d="M16.6 9.4l4 9.6c.6 1.3-.1 2.8-1.5 3.2-1.4.5-3-.1-3.6-1.5l-4-9.6" /></>} />,
    ZoomIn: (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>} />,
    Lock: (p) => <Icon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />,
    Palette: (p) => <Icon {...p} path={<><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.8-.15 2.61-.42.92-.3 1.39-1.28 1.39-2.25 0-.41-.09-.81-.25-1.17-.16-.36-.08-.78.19-1.06l.72-.72c.57-.57 1.35-.88 2.16-.88 1.08 0 1.96-.86 2.15-1.92A10 10 0 0 0 12 2Z" /></>} />,

    // Missing Icons for Settings
    Type: (p) => <Icon {...p} path={<><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></>} />,
    Layout: (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>} />,
    Activity: (p) => <Icon {...p} path={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} />,
    Grid: (p) => <Icon {...p} path={<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>} />,
    Plus: (p) => <Icon {...p} path={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />,

    // Silbentest Icons
    SyllableTestTwo: (p) => <Icon {...p} size={p.size || 24} path={<g transform="translate(1, 7.5) scale(0.06)">
        <path
            d="M 0,20 Q 0,0 20,0 H 120 Q 140,0 140,20 V 45 C 190,30 190,120 140,105 V 130 Q 140,150 120,150 H 20 Q 0,150 0,130 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="20"
        />
        <path
            d="M 30,20 Q 30,0 50,0 H 200 Q 220,0 220,20 V 130 Q 220,150 200,150 H 50 Q 30,150 30,130 V 105 C 80,120 80,30 30,45 Z"
            transform="translate(140, 0)"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="20"
        />
    </g>} />,
    SyllableTestMulti: (p) => <Icon {...p} size={p.size || 24} path={<g transform="translate(1, 8.5) scale(0.05)">
        <path
            d="M 0,20 Q 0,0 20,0 H 120 Q 140,0 140,20 V 45 C 190,30 190,120 140,105 V 130 Q 140,150 120,150 H 20 Q 0,150 0,130 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="20"
        />
        <circle cx="160" cy="75" r="30" fill="currentColor" stroke="none" />
        <circle cx="230" cy="75" r="30" fill="currentColor" stroke="none" />
        <path
            d="M 30,20 Q 30,0 50,0 H 200 Q 220,0 220,20 V 130 Q 220,150 200,150 H 50 Q 30,150 30,130 V 105 C 80,120 80,30 30,45 Z"
            transform="translate(250, 0)"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="20"
        />
    </g>} />,
    PuzzleZigzag: (p) => <Icon {...p} size={p.size || 24} path={<g transform="translate(1, -1) scale(0.95)">
        <path d="M1 5 h7.5 l3.5 5.5 -3.5 5.5 h-7.5 c-.5 0-1-.5-1-1 v-9 c0-.5.5-1 1-1 z" fill="currentColor" stroke="currentColor" strokeWidth="2.5" />
        <path d="M13 5 l3.5 5.5 -3.5 5.5 h7 c.5 0 1-.5 1-1 v-9 c0-.5-.5-1-1-1 h-7 z" fill="currentColor" stroke="currentColor" strokeWidth="2.5" />
    </g>} />,
    SyllableBuild1: (p) => <Icon {...p} size={p.size || 24} path={<g transform="translate(1, 0)">
        <path d="M1 6 h8 l3 6 -3 6 h-8 a1 1 0 0 1 -1 -1 v-10 a1 1 0 0 1 1 -1 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 6 h6.5 a1 1 0 0 1 1 1 v10 a1 1 0 0 1 -1 1 h-6.5 l3 -6 -3 -6 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </g>} />,
    SyllableBuild2: (p) => <Icon {...p} size={p.size || 24} path={<g transform="translate(0, 0)">
        <path d="M0.5 6 h5.5 l2 6 -2 6 h-5.5 a1 1 0 0 1 -1 -1 v-10 a1 1 0 0 1 1 -1 z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 6 h6 l2 6 -2 6 h-6 l2 -6 -2 -6 z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
        <path d="M18 6 h5.5 a1 1 0 0 1 1 1 v10 a1 1 0 0 1 -1 1 h-5.5 l2 -6 -2 -6 z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
    </g>} />,
    LetterSearch: (p) => <Icon {...p} size={p.size || 24} path={<g>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M9 17L12 7L15 17" />
        <line x1="10" y1="14" x2="14" y2="14" />
    </g>} />,
    LetterMarker: (p) => <Icon {...p} size={p.size || 24} path={<g>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#fde047" />
        <path d="M9 17L12 7L15 17" />
        <line x1="10" y1="14" x2="14" y2="14" />
    </g>} />,
    LetterMarkerInstruction: (p) => <Icon {...p} size={p.size || 24} viewBox="0 0 800 800" strokeWidth="10" path={<>
        <path d="M 92.38 144.07 C 92.38 144.07 254.14 141.98 351.32 144.07 C 360.16 144.26 362.38 145.59 370.05 150.02 C 377.80 154.49 378.87 156.67 384.79 163.39 C 388.75 167.89 389.43 169.21 391.83 174.71 C 394.21 180.20 395.23 181.57 395.30 187.56 C 396.53 288.14 397.53 359.40 395.34 462.07 C 395.15 471.01 393.46 473.15 389.05 480.90 C 384.61 488.71 382.62 489.92 376.04 496.00 C 371.64 500.05 370.37 500.84 364.89 503.20 C 359.43 505.55 358.01 506.26 352.08 506.33 C 256.97 507.42 190.32 508.41 93.14 506.33 C 84.30 506.14 82.07 504.80 74.41 500.37 C 66.66 495.90 65.59 493.72 59.66 487.00 C 55.70 482.51 55.03 481.18 52.63 475.68 C 50.25 470.19 49.23 468.82 49.16 462.83 C 47.93 362.26 48.01 288.92 49.12 188.32 C 49.18 182.33 49.68 180.78 52.32 175.41 C 56.28 167.35 57.33 165.39 63.55 158.95 C 69.77 152.51 71.64 151.29 79.57 147.20 C 84.85 144.47 87.90 145.16 92.38 144.07 L 92.38 144.07 Z" fill="#fecb3e" fillOpacity="1" stroke="#444444" strokeWidth="11.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 164.52 425.82 L 222.61 225.90 L 277.84 418.49" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 183.76 365.45 L 260.39 365.45" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 279.79 471.25 C 279.79 471.25 278.16 464.80 274.95 460.69 C 271.72 456.56 270.85 455.00 265.87 453.41 C 258.50 451.06 256.33 450.92 248.73 452.34 C 243.61 453.30 242.71 454.92 238.87 458.47 C 236.95 460.24 236.83 461.15 236.39 463.73 C 234.63 474.23 233.84 488.47 233.84 488.47 C 233.84 488.47 232.86 464.77 227.69 447.69 C 226.15 442.60 223.69 442.26 219.08 439.66 C 214.51 437.07 213.10 436.70 207.86 436.49 C 202.63 436.27 201.14 436.42 196.44 438.74 C 191.71 441.08 191.26 442.67 187.61 446.51 C 185.80 448.41 184.87 448.79 184.39 451.38 C 182.56 461.36 182.38 475.00 182.38 475.00 C 182.38 475.00 182.67 425.15 181.05 392.23 C 180.79 386.94 180.55 385.42 177.75 380.93 C 174.95 376.45 173.76 375.43 169.07 373.04 C 164.38 370.66 162.88 370.60 157.63 370.70 C 152.46 370.80 151.05 371.05 146.48 373.47 C 141.83 375.93 140.78 376.94 137.73 381.24 C 134.69 385.55 133.45 386.82 133.29 392.11 C 131.36 454.03 131.91 491.80 132.24 558.15 C 132.30 568.78 131.24 571.49 134.23 581.68 C 135.73 586.79 141.80 590.72 141.80 590.72 C 141.80 590.72 130.86 576.53 119.53 567.59 C 115.41 564.34 113.57 563.87 108.35 564.33 C 100.62 565.03 98.60 565.84 92.07 570.06 C 87.66 572.93 87.19 574.62 85.03 579.44 C 82.88 584.26 82.72 585.67 82.73 590.95 C 82.75 596.26 83.30 597.52 85.10 602.50 C 86.01 605.00 86.81 605.30 88.64 607.23 C 109.98 629.67 120.73 642.56 146.08 666.64 C 151.86 672.12 153.79 672.81 161.07 676.01 C 170.76 680.27 173.12 680.97 183.48 683.08 C 193.85 685.19 196.31 685.10 206.88 685.36 C 222.75 685.75 226.37 686.27 242.15 684.54 C 252.65 683.38 254.99 682.47 264.97 678.98 C 272.47 676.36 274.10 675.40 280.75 671.05 C 289.62 665.24 291.57 663.79 299.30 656.52 C 305.10 651.06 306.65 649.83 310.65 642.92 C 318.64 629.11 320.16 625.78 325.74 610.82 C 328.53 603.34 328.89 601.37 329.13 593.38 C 330.32 554.08 332.56 536.74 329.14 498.52 C 328.44 490.73 325.55 488.93 319.37 484.19 C 313.17 479.45 310.60 480.29 303.01 478.53 C 300.45 477.94 299.56 477.92 297.18 479.05 C 292.46 481.30 290.88 481.63 287.72 485.82 C 283.24 491.76 280.75 500.85 280.75 500.85 L 279.79 471.25 L 279.79 471.25 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 620.26 463.61 C 620.26 463.61 666.22 464.31 698.95 463.57 C 705.68 463.42 707.44 463.81 713.76 461.48 C 721.65 458.59 724.29 458.40 729.97 452.17 C 737.89 443.49 739.55 440.75 742.96 429.46 C 747.85 413.24 747.50 409.08 748.08 392.13 C 749.78 342.85 749.23 327.40 748.01 282.56 C 747.78 274.08 747.07 272.13 744.61 264.02 C 742.15 255.90 741.52 253.98 737.15 246.73 C 732.77 239.49 731.47 237.93 725.34 232.11 C 719.22 226.29 717.59 225.08 710.16 221.11 C 701.24 216.34 699.21 214.67 689.28 212.83 C 671.09 209.45 666.80 209.46 648.31 209.63 C 638.21 209.72 635.98 210.94 626.17 213.40 C 619.63 215.03 618.18 215.66 612.14 218.68 C 604.60 222.46 602.84 223.31 596.13 228.43 C 590.76 232.54 589.15 233.35 585.48 239.05 C 578.17 250.40 576.57 253.15 572.01 265.88 C 569.15 273.86 569.57 276.05 569.19 284.53 C 568.15 308.31 568.86 337.43 568.86 337.43 C 568.86 337.43 568.36 370.69 569.39 397.88 C 569.77 408.06 569.69 410.45 571.98 420.37 C 574.28 430.28 574.93 432.61 579.51 441.67 C 582.57 447.70 583.64 449.10 588.75 453.49 C 593.86 457.88 595.39 458.75 601.78 460.80 C 609.79 463.38 613.79 462.63 620.26 463.61 L 620.26 463.61 Z" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="10.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 569.11 463.61 C 569.11 463.61 580.46 449.77 592.72 442.61 C 601.66 437.38 604.62 437.03 614.95 436.80 C 623.43 436.61 625.73 437.57 633.16 441.70 C 646.31 448.99 659.93 461.76 659.93 461.76 C 659.93 461.76 667.80 453.11 675.23 447.17 C 675.23 447.17 682.02 440.09 687.29 437.08 C 692.68 434.02 696.11 433.80 701.37 433.91 C 706.63 434.02 708.20 434.19 713.88 437.66 C 719.56 441.13 721.13 442.70 726.81 447.30 C 732.49 451.90 746.95 462.07 746.95 462.07" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="10.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 601.08 303.07 C 601.08 303.07 602.18 312.46 606.96 317.65 C 611.21 322.25 613.57 321.89 619.66 323.21 C 622.89 323.90 623.87 323.28 626.89 321.94 C 630.66 320.28 632.15 320.15 634.39 316.68 C 638.09 310.97 639.74 309.26 639.53 302.44 C 639.32 295.63 638.45 293.23 633.53 288.56 C 628.45 283.73 626.02 282.88 619.04 282.97 C 612.81 283.06 610.69 284.27 606.52 288.93 C 601.99 294.00 601.08 303.07 601.08 303.07 L 601.08 303.07 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="10.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 677.80 302.87 C 677.80 302.87 678.90 312.26 683.68 317.45 C 687.93 322.05 690.29 321.69 696.39 323.00 C 699.62 323.70 700.59 323.08 703.62 321.74 C 707.38 320.07 708.87 319.95 711.12 316.48 C 714.82 310.77 716.46 309.05 716.25 302.24 C 716.04 295.43 715.18 293.03 710.26 288.35 C 705.17 283.53 702.74 282.68 695.76 282.77 C 689.53 282.86 687.41 284.06 683.24 288.73 C 678.71 293.80 677.80 302.87 677.80 302.87 L 677.80 302.87 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="10.6" strokeLinecap="round" strokeLinejoin="round" />
    </>} />,
    LetterCaseToggle: (p) => <Icon {...p} size={p.size || 24} path={<g>
        {/* Uppercase A */}
        <path d="M4 19L7.5 7L11 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="5.5" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* Slash / */}
        <line x1="14" y1="19" x2="17" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lowercase a */}
        <path d="M 18.5 15.5 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0 M 23.5 13.5 v 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>} />,
    Group: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Two boxes - pushed further apart */}
            <rect x="2" y="5" width="8" height="6" rx="2.5" />
            <rect x="14" y="5" width="8" height="6" rx="2.5" />
            {/* Connecting arc - adjusted for wider gap */}
            <path d="M6 11v1c0 4 3 6 6 6s6-2 6-6v-1" />
        </svg>
    ),
    Dice5: (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="5" ry="5" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" /></>} />,
    Zap: (p) => <Icon {...p} strokeLinejoin="miter" path={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
    // Updated to match high-quality silhouettes (Leaping Rabbit, Snail with Shell)
    // Snail: Standard icon with distinct shell and antennae
    Snail: (p) => <Icon {...p} viewBox="0 0 512 512" fill="currentColor" stroke="none" path={
        <path d="M439.4 346.8c-2.3-13.7-6.2-26.2-11.4-37.4 3.7-8.2 6.5-16.7 8.3-25.5 13.5-66.2-12.2-124.9-63.5-155.8-23.7-14.3-51-22-79.6-22-29.2 0-57 8-81 22.8-17.5 10.8-32.5 25.1-44.1 42.1-42.6-11.5-84.5-9.1-120.3 3.4-17.6 6.1-24.8 28.3-14.2 43.1 9.3 13.1 23.3 14.8 38.8 8.4 22-9.1 52.8-13 86.8-6.1-9.9 22.1-14.7 46.2-12.8 70.8.2 2.8.5 5.5.9 8.3-40.4 28.3-33.1 63.3 14.7 63.3h224.2c27.1 0 53.6-6.1 76-17.6 13.7-7 24.3-18.7 27.2-24.9 2.5-5.3-25.5 7.1-50 27.1zM293.2 148.1c43.2 0 78.4 35.2 78.4 78.4 0 43.1-35.1 78.3-78.3 78.4-43.2 0-78.4-35.2-78.4-78.4-.1-43.2 35.1-78.4 78.3-78.4z" />
    } />,

    // Rabbit: Running/Leaping silhouette with clear ears
    Rabbit: (p) => <Icon {...p} viewBox="0 0 512 512" fill="currentColor" stroke="none" path={
        <path d="M142.9 226c11.7-8.8 19.3-22.3 20.8-37.5l.3-3.6 16.5-23c21-29.4 44.8-56.9 70.8-82.9 8.1-8.1 27.9-10.8 36.3-2.4 7.6 7.6 5.8 25.6-2.4 33.7-19.9 19.9-38.3 41.2-54.8 63.8l-1.9 2.7 3.3.6c5.5 1 11.2 1.5 16.8 1.5 45.4 0 88.5-47.5 125.7-84.7 9.8-9.8 25.7-9.8 35.5 0 9.8 9.8 9.8 25.7 0 35.5-31.5 31.5-66.2 68.6-96.8 94.4 20.5 5 40.5 11.3 59.8 18.9 44.4 17.5 44.4 70.3 35.1 116.8-9.3 46.5-51 86-98.3 86H120c-13.3 0-24-10.7-24-24v-48c0-13.3 10.7-24 24-24h96c13.3 0 24-10.7 24-24 0-13.3-10.7-24-24-24H44.1c-16.1 0-28.5-12.5-31.7-28.3C8.8 254.4 20 231.7 39.8 221.4c29.1-15.1 66.5-17.7 103.1-4.6z" />
    } />,

    // Human Figures (Material Design style)
    Walker: (p) => <Icon {...p} viewBox="0 0 24 24" fill="currentColor" stroke="none" path={
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
    } />,
    Runner: (p) => <Icon {...p} viewBox="0 -960 960 960" fill="currentColor" stroke="none" path={
        <path d="M520-80v-200l-84-80-31 138q-4 16-17.5 24.5T358-192l-198-40q-17-3-26-17t-6-31q3-17 17-26.5t31-5.5l152 32 64-324-72 28v96q0 17-11.5 28.5T280-440q-17 0-28.5-11.5T240-480v-122q0-12 6.5-21.5T264-638l134-58q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q21 34 54.5 59t77.5 33q17 3 28.5 15t11.5 29q0 17-11.5 28t-27.5 9q-54-8-101-33.5T540-540l-24 120 72 68q6 6 9 13.5t3 15.5v243q0 17-11.5 28.5T560-40q-17 0-28.5-11.5T520-80Zm20-660q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z" />
    } />,
    Highlighter: (p) => <Icon {...p} viewBox="0 0 800 800" strokeWidth="60" path={<>
        <path d="M 295.53 407.22 C 295.53 407.22 174.26 501.09 109.21 604.32 C 86.11 640.98 109.67 702.15 109.67 702.15 C 109.67 702.15 266.78 732.78 389.01 701.81 C 443.36 688.04 476.84 609.12 476.84 609.12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 699.22 439.99 C 699.22 439.99 610.75 534.41 556.49 590.61 C 551.52 595.76 550.22 596.84 544.20 600.55 C 538.19 604.25 536.66 604.94 529.96 606.95 C 523.26 608.97 521.62 609.23 514.65 609.44 C 507.69 609.64 506.04 609.48 499.24 607.86 C 492.44 606.25 490.52 606.31 484.67 602.32 C 473.00 594.35 470.75 591.88 460.81 581.63 C 398.66 517.62 364.11 480.80 307.12 419.41 C 302.24 414.16 301.35 412.65 297.97 406.22 C 294.59 399.79 293.98 398.17 292.22 391.05 C 290.45 383.94 290.24 382.20 290.20 374.85 C 290.16 367.50 290.35 365.76 292.03 358.62 C 293.71 351.49 294.30 349.85 297.60 343.38 C 300.91 336.90 301.73 335.34 306.60 330.08 C 359.68 272.69 449.28 179.42 449.28 179.42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 388.69 112.28 L 509.46 239.73" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
    </>} />,
    Eraser: (p) => <Icon {...p} path={<><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L11 20" /><path d="M17 2L21 6" /><path d="M7 20l10-10" /></>} />,
    Link: (p) => <Icon {...p} path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>} />,
    File: (p) => <Icon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>} />,
    Files: (p) => <Icon {...p} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /></>} />,
    FileText: (p) => <Icon {...p} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>} />,

    // Composite Icon: Document + Edit2 Pen
    WritingMenu: (p) => <Icon {...p} path={<>
        {/* Document Box (faded) */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" className="opacity-50" />
        {/* Pen (Edit2) */}
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    </>} />,

    // Multi-color Wortarten Icon
    Wortarten: (p) => <Icon {...p} viewBox="0 0 24 24" fill="none" stroke="none" path={<>
        {/* Blue Top */}
        <rect x="7" y="2" width="10" height="10" rx="3" fill="#3b82f6" transform="rotate(-5 12 7)" />
        {/* Red Bottom Left */}
        <rect x="3" y="11" width="10" height="10" rx="3" fill="#ef4444" transform="rotate(-10 8 16)" />
        {/* Green Bottom Right */}
        <rect x="13" y="10" width="10" height="10" rx="3" fill="#22c55e" transform="rotate(5 18 15)" />
    </>} />,

    // New Icons from import/svg-grafiken
    SilbenKorrigieren: (p) => <Icon {...p} viewBox="0 100 800 600" fill="none" stroke="currentColor" strokeWidth="50" path={<>
        <path d="M 666.68 127.84 C 666.68 127.84 674.73 120.34 682.72 116.67 C 690.71 112.99 692.87 112.44 701.65 111.76 C 710.42 111.07 712.64 111.28 721.11 113.67 C 729.58 116.05 731.59 117.02 738.71 122.19 C 745.83 127.35 747.38 128.95 752.26 136.26 C 757.15 143.56 758.04 145.60 760.09 154.14 C 762.14 162.68 761.49 164.85 761.23 173.63 C 761.10 178.03 760.88 179.13 759.22 183.21 C 755.93 191.36 756.46 194.29 750.33 200.60 C 652.42 301.42 610.80 366.61 479.49 471.28 C 441.47 501.59 375.16 499.68 375.16 499.68 C 375.16 499.68 372.79 496.91 373.40 494.55 C 383.10 456.53 372.62 428.89 402.89 391.05 C 505.54 262.70 574.35 219.96 666.68 127.84 L 666.68 127.84 Z" />
        <path d="M 33.37 553.50 C 33.37 553.50 34.99 571.34 38.36 585.68 C 40.05 592.86 40.71 594.52 44.56 601.14 C 52.26 614.36 53.31 617.76 63.94 629.59 C 74.56 641.42 77.51 643.96 91.43 653.32 C 105.36 662.68 109.50 663.76 125.35 670.87 C 133.29 674.44 135.46 674.65 144.09 676.95 C 152.72 679.26 154.62 680.13 163.63 681.10 C 181.62 683.03 185.74 684.16 203.87 683.38 C 222.00 682.60 225.94 681.12 243.57 677.64 C 252.40 675.90 254.17 674.86 262.44 671.81 C 270.70 668.77 272.83 668.37 280.24 664.13 C 295.05 655.69 298.24 653.62 311.63 643.76 C 318.33 638.82 319.74 637.50 324.73 631.39 C 334.68 619.18 336.71 616.32 344.69 603.20 C 348.68 596.64 349.38 594.99 351.22 587.83 C 354.90 573.54 356.90 555.72 356.90 555.72" />
        <path d="M 382.60 553.50 C 382.60 553.50 384.22 571.34 387.59 585.68 C 389.28 592.86 389.94 594.52 393.80 601.14 C 401.49 614.36 402.54 617.76 413.17 629.59 C 423.79 641.42 426.74 643.96 440.66 653.32 C 454.59 662.68 458.73 663.76 474.58 670.87 C 482.52 674.44 484.69 674.65 493.32 676.95 C 501.95 679.26 503.85 680.13 512.86 681.10 C 530.86 683.03 534.98 684.16 553.10 683.38 C 571.23 682.60 575.17 681.12 592.80 677.64 C 601.63 675.90 603.40 674.86 611.67 671.81 C 619.93 668.77 622.06 668.37 629.47 664.13 C 644.28 655.69 647.47 653.62 660.86 643.76 C 667.57 638.82 668.97 637.50 673.96 631.39 C 683.91 619.18 685.94 616.32 693.92 603.20 C 697.91 596.64 698.61 594.99 700.45 587.83 C 704.13 573.54 706.13 555.72 706.13 555.72" />
    </>} />,
    Silbenbau1: (p) => <Icon {...p} viewBox="100 240 600 320" fill="none" stroke="currentColor" strokeWidth="27" path={<>
        <path d="M 311.00 246.00 C 316.44 246.15 317.67 247.71 322.00 251.00 C 329.09 256.39 331.06 257.59 336.00 265.00 C 367.50 312.25 384.35 337.00 412.00 386.00 C 416.25 393.54 415.31 396.35 415.00 405.00 C 414.84 409.43 413.31 410.22 411.00 414.00 C 384.75 457.05 371.50 480.75 340.00 528.00 C 332.93 538.60 330.79 540.84 321.00 549.00 C 316.95 552.37 315.27 552.88 310.00 553.00 C 246.30 554.40 204.45 555.80 139.00 553.00 C 130.96 552.66 129.35 549.94 123.00 545.00 C 116.95 540.30 115.51 538.81 112.00 532.00 C 107.70 523.65 106.23 521.39 106.00 512.00 C 103.90 425.55 102.85 372.85 106.00 285.00 C 106.41 273.47 109.15 270.94 115.00 261.00 C 118.39 255.23 120.36 254.59 126.00 251.00 C 130.44 248.17 137.00 247.00 137.00 247.00 C 137.00 247.00 246.25 244.25 311.00 246.00 Z" />
        <path d="M 482.00 246.00 C 482.00 246.00 592.45 243.55 660.00 246.00 C 667.44 246.27 668.84 248.81 675.00 253.00 C 680.26 256.58 681.96 257.41 685.00 263.00 C 690.70 273.51 693.57 276.05 694.00 288.00 C 697.15 375.50 696.80 426.55 694.00 513.00 C 693.66 523.53 691.67 526.12 686.00 535.00 C 681.03 542.78 678.59 543.74 671.00 549.00 C 666.67 552.00 665.27 552.89 660.00 553.00 C 593.50 554.40 494.97 555.31 481.00 553.00 C 467.03 550.69 470.20 547.55 463.00 541.00 C 460.02 538.29 459.57 536.98 459.00 533.00 C 457.73 524.09 454.74 520.93 459.00 513.00 C 483.85 466.80 530.00 401.00 530.00 401.00 C 530.00 401.00 483.85 332.25 459.00 285.00 C 455.02 277.43 457.75 274.46 459.00 266.00 C 459.59 262.02 459.90 260.56 463.00 258.00 C 470.62 251.71 482.00 247.00 482.00 247.00 L 482.00 246.00 Z" />
    </>} />,
    Silbenbau2: (p) => <Icon {...p} viewBox="0 240 800 320" fill="none" stroke="currentColor" strokeWidth="27" path={<>
        <path d="M 225.00 246.00 C 230.44 246.15 231.67 247.71 236.00 251.00 C 243.09 256.39 245.06 257.59 250.00 265.00 C 281.50 312.25 298.35 337.00 326.00 386.00 C 330.25 393.54 329.31 396.35 329.00 405.00 C 328.84 409.43 327.31 410.22 325.00 414.00 C 298.75 457.05 285.50 480.75 254.00 528.00 C 246.93 538.60 244.79 540.84 235.00 549.00 C 230.95 552.37 229.27 552.88 224.00 553.00 C 160.30 554.40 118.45 555.80 53.00 553.00 C 44.96 552.66 43.35 549.94 37.00 545.00 C 30.95 540.30 29.51 538.81 26.00 532.00 C 21.70 523.65 20.23 521.39 20.00 512.00 C 17.90 425.55 16.85 372.85 20.00 285.00 C 20.41 273.47 23.15 270.94 29.00 261.00 C 32.39 255.23 34.36 254.59 40.00 251.00 C 44.44 248.17 51.00 247.00 51.00 247.00 C 51.00 247.00 160.25 244.25 225.00 246.00 Z" />
        <path d="M 316.00 246.00 C 316.00 246.00 410.30 244.25 467.00 246.00 C 472.43 246.17 473.94 247.38 478.00 251.00 C 486.81 258.87 488.50 261.14 495.00 271.00 C 528.25 321.40 545.00 349.50 573.00 395.00 C 574.49 397.42 576.40 398.52 575.00 401.00 C 554.00 438.10 513.00 501.00 513.00 501.00 C 513.00 501.00 500.56 523.36 488.00 540.00 C 483.76 545.61 481.98 546.30 476.00 550.00 C 472.37 552.25 471.27 552.92 467.00 553.00 C 411.35 554.05 373.35 554.75 317.00 553.00 C 311.57 552.83 310.27 551.37 306.00 548.00 C 301.48 544.43 299.82 543.47 298.00 538.00 C 295.14 529.42 295.68 527.04 296.00 518.00 C 296.14 514.16 296.98 513.27 299.00 510.00 C 324.55 468.70 369.00 400.00 369.00 400.00 C 369.00 400.00 320.85 332.00 296.00 283.00 C 291.30 273.73 294.71 269.86 298.00 260.00 C 299.91 254.26 302.09 253.54 307.00 250.00 C 310.46 247.50 316.00 247.00 316.00 247.00 L 316.00 246.00 Z" />
        <path d="M 568.00 246.00 C 568.00 246.00 678.45 243.55 746.00 246.00 C 753.44 246.27 754.84 248.81 761.00 253.00 C 766.26 256.58 767.96 257.41 771.00 263.00 C 776.70 273.51 779.57 276.05 780.00 288.00 C 783.15 375.50 782.80 426.55 780.00 513.00 C 779.66 523.53 777.67 526.12 772.00 535.00 C 767.03 542.78 764.59 543.74 757.00 549.00 C 752.67 552.00 751.27 552.89 746.00 553.00 C 679.50 554.40 580.97 555.31 567.00 553.00 C 553.03 550.69 556.20 547.55 549.00 541.00 C 546.02 538.29 545.57 536.98 545.00 533.00 C 543.73 524.09 540.74 520.93 545.00 513.00 C 569.85 466.80 616.00 401.00 616.00 401.00 C 616.00 401.00 569.85 332.25 545.00 285.00 C 541.02 277.43 543.75 274.46 545.00 266.00 C 545.59 262.02 545.90 260.56 549.00 258.00 C 556.62 251.71 568.00 247.00 568.00 247.00 L 568.00 246.00 Z" />
    </>} />,
    Silbenpuzzle1: (p) => <Icon {...p} viewBox="100 260 600 280" fill="none" stroke="currentColor" strokeWidth="24" path={<>
        <path d="M 137.29 271.00 C 137.29 271.00 248.14 269.95 314.29 271.00 C 319.86 271.09 321.31 271.51 326.29 274.00 C 333.22 277.46 335.68 277.78 340.29 284.00 C 346.42 292.26 348.02 294.80 349.29 305.00 C 352.14 327.77 349.29 356.00 349.29 356.00 C 349.29 356.00 358.90 354.98 366.29 357.00 C 374.06 359.12 376.20 359.74 382.29 365.00 C 389.59 371.29 391.64 373.09 395.29 382.00 C 399.09 391.24 399.04 394.04 398.29 404.00 C 397.65 412.51 396.42 414.52 392.29 422.00 C 389.06 427.86 387.76 429.15 382.29 433.00 C 375.38 437.87 373.45 438.78 365.29 441.00 C 358.33 442.90 349.29 442.00 349.29 442.00 C 349.29 442.00 350.39 475.85 348.29 500.00 C 347.82 505.42 346.53 506.63 343.29 511.00 C 338.75 517.14 337.61 518.71 331.29 523.00 C 326.11 526.52 324.56 527.84 318.29 528.00 C 249.34 529.75 145.84 530.30 134.29 528.00 C 122.74 525.70 120.31 522.57 112.29 514.00 C 106.64 507.96 105.57 505.27 105.29 497.00 C 102.84 422.80 103.54 375.15 105.29 302.00 C 105.45 295.31 106.92 293.78 110.29 288.00 C 113.34 282.77 114.09 281.09 119.29 278.00 C 126.64 273.65 137.29 272.00 137.29 272.00 L 137.29 271.00 Z" />
        <path d="M 485.29 271.00 C 485.29 271.00 594.39 268.90 662.29 271.00 C 670.40 271.25 672.10 273.26 679.29 277.00 C 683.54 279.21 684.64 280.02 687.29 284.00 C 691.98 291.03 694.98 292.55 695.29 301.00 C 698.09 376.25 699.49 422.70 695.29 499.00 C 694.72 509.48 690.84 511.71 683.29 519.00 C 676.78 525.29 674.34 527.60 665.29 528.00 C 594.59 531.15 489.33 528.87 481.29 528.00 C 473.26 527.13 468.44 524.38 461.29 517.00 C 454.30 509.77 452.74 506.96 451.29 497.00 C 448.13 475.18 451.29 448.00 451.29 448.00 C 451.29 448.00 465.17 445.21 475.29 440.00 C 481.24 436.94 482.54 435.54 486.29 430.00 C 492.16 421.33 493.87 419.18 496.29 409.00 C 498.48 399.81 498.05 397.29 496.29 388.00 C 494.83 380.28 493.48 378.65 489.29 372.00 C 485.73 366.34 484.54 365.15 479.29 361.00 C 473.60 356.50 472.13 355.44 465.29 353.00 C 459.30 350.86 451.29 351.00 451.29 351.00 C 451.29 351.00 449.23 323.95 451.29 302.00 C 451.97 294.76 453.44 293.16 457.29 287.00 C 460.33 282.14 461.24 280.70 466.29 278.00 C 474.20 273.77 485.29 272.00 485.29 272.00 L 485.29 271.00 Z" />
    </>} />,
    Silbenpuzzle2: (p) => <Icon {...p} viewBox="0 260 800 280" fill="none" stroke="currentColor" strokeWidth="24" path={<>
        <path d="M 47.00 271.00 C 47.00 271.00 157.85 269.95 224.00 271.00 C 229.57 271.09 231.02 271.51 236.00 274.00 C 242.92 277.46 245.39 277.78 250.00 284.00 C 256.13 292.26 257.72 294.80 259.00 305.00 C 261.85 327.77 259.00 356.00 259.00 356.00 C 259.00 356.00 268.61 354.98 276.00 357.00 C 283.77 359.12 285.90 359.74 292.00 365.00 C 299.29 371.29 301.34 373.09 305.00 382.00 C 308.79 391.24 308.75 394.04 308.00 404.00 C 307.36 412.51 306.12 414.52 302.00 422.00 C 298.77 427.86 297.47 429.15 292.00 433.00 C 285.09 437.87 283.16 438.78 275.00 441.00 C 268.04 442.90 259.00 442.00 259.00 442.00 C 259.00 442.00 260.10 475.85 258.00 500.00 C 257.53 505.42 256.23 506.63 253.00 511.00 C 248.46 517.14 247.32 518.71 241.00 523.00 C 235.82 526.52 234.27 527.84 228.00 528.00 C 159.05 529.75 55.55 530.30 44.00 528.00 C 32.45 525.70 30.02 522.57 22.00 514.00 C 16.35 507.96 15.27 505.27 15.00 497.00 C 12.55 422.80 13.25 375.15 15.00 302.00 C 15.16 295.31 16.63 293.78 20.00 288.00 C 23.05 282.77 23.79 281.09 29.00 278.00 C 36.35 273.65 47.00 272.00 47.00 272.00 L 47.00 271.00 Z" />
        <path d="M 318.00 271.00 C 318.00 271.00 419.35 269.25 482.00 271.00 C 489.11 271.20 490.92 272.31 497.00 276.00 C 503.81 280.13 505.64 281.34 510.00 288.00 C 514.45 294.79 515.29 296.92 516.00 305.00 C 518.02 327.86 516.00 356.00 516.00 356.00 C 516.00 356.00 527.49 354.94 536.00 358.00 C 545.52 361.42 547.98 362.73 555.00 370.00 C 561.01 376.23 561.68 378.66 564.00 387.00 C 566.29 395.25 566.00 397.50 565.00 406.00 C 564.17 413.07 563.69 414.92 560.00 421.00 C 555.87 427.81 554.24 429.06 548.00 434.00 C 543.27 437.75 541.86 438.54 536.00 440.00 C 527.23 442.19 516.00 442.00 516.00 442.00 C 516.00 442.00 517.10 475.85 515.00 500.00 C 514.53 505.42 513.23 506.63 510.00 511.00 C 505.46 517.14 504.32 518.71 498.00 523.00 C 492.82 526.52 491.27 527.83 485.00 528.00 C 420.60 529.75 377.70 529.40 314.00 528.00 C 308.73 527.88 307.41 526.88 303.00 524.00 C 296.86 520.00 295.11 519.06 291.00 513.00 C 286.35 506.15 284.89 504.23 284.00 496.00 C 281.69 474.52 284.00 448.00 284.00 448.00 C 284.00 448.00 296.92 446.05 306.00 441.00 C 313.52 436.82 315.18 435.12 320.00 428.00 C 325.76 419.48 326.63 417.00 329.00 407.00 C 330.76 399.56 330.37 397.53 329.00 390.00 C 327.62 382.43 326.73 380.72 323.00 374.00 C 319.89 368.41 318.83 367.20 314.00 363.00 C 308.35 358.09 306.95 356.78 300.00 354.00 C 293.20 351.28 284.00 351.00 284.00 351.00 C 284.00 351.00 280.58 323.78 284.00 302.00 C 285.66 291.46 288.20 289.22 295.00 281.00 C 299.38 275.71 301.60 275.50 308.00 273.00 C 312.21 271.35 318.00 272.00 318.00 272.00 L 318.00 271.00 Z" />
        <path d="M 575.00 271.00 C 575.00 271.00 684.10 268.90 752.00 271.00 C 760.11 271.25 761.80 273.26 769.00 277.00 C 773.24 279.21 774.35 280.02 777.00 284.00 C 781.69 291.03 784.69 292.55 785.00 301.00 C 787.80 376.25 789.20 422.70 785.00 499.00 C 784.42 509.48 780.55 511.71 773.00 519.00 C 766.49 525.29 764.05 527.60 755.00 528.00 C 684.30 531.15 579.04 528.87 571.00 528.00 C 562.96 527.13 558.14 524.38 551.00 517.00 C 544.00 509.77 542.44 506.96 541.00 497.00 C 537.84 475.18 541.00 448.00 541.00 448.00 C 541.00 448.00 554.88 445.21 565.00 440.00 C 570.95 436.94 572.25 435.54 576.00 430.00 C 581.87 421.33 583.58 419.18 586.00 409.00 C 588.19 399.81 587.76 397.29 586.00 388.00 C 584.54 380.28 583.19 378.65 579.00 372.00 C 575.44 366.34 574.25 365.15 569.00 361.00 C 563.31 356.50 561.83 355.44 555.00 353.00 C 549.01 350.86 541.00 351.00 541.00 351.00 C 541.00 351.00 538.94 323.95 541.00 302.00 C 541.68 294.76 543.15 293.16 547.00 287.00 C 550.04 282.14 550.95 280.70 556.00 278.00 C 563.90 273.77 575.00 272.00 575.00 272.00 L 575.00 271.00 Z" />
    </>} />,

    HandInstruction: ({ size = 64, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feOffset dx="0" dy="1" result="offsetBlur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* The Box - matching the look of the uploaded image */}
            <rect
                x="4"
                y="4"
                width="40"
                height="32"
                rx="8"
                fill="#f1f5f9"
                stroke="#1e293b"
                strokeWidth="2.5"
                filter="url(#shadow)"
            />

            {/* The Hand Icon - pointing to the box */}
            <g transform="translate(18, 14) scale(0.9)" stroke="black" strokeWidth="2.5" fill="white" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </g>
        </svg>
    ),

    SelectionHint: ({ size = 120, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs></defs>
            <path d="M 75.96 144.07 C 75.96 144.07 292.81 141.98 423.10 144.07 C 434.94 144.26 437.92 145.59 448.21 150.02 C 458.59 154.49 460.02 156.67 467.97 163.39 C 473.28 167.89 474.19 169.21 477.39 174.71 C 480.59 180.20 481.95 181.57 482.05 187.56 C 483.70 288.14 485.04 359.40 482.10 462.07 C 481.85 471.01 479.58 473.15 473.67 480.90 C 467.71 488.71 465.05 489.92 456.23 496.00 C 450.33 500.05 448.62 500.84 441.28 503.20 C 433.97 505.55 432.06 506.26 424.11 506.33 C 296.60 507.42 207.26 508.41 76.97 506.33 C 65.13 506.14 62.14 504.80 51.86 500.37 C 41.48 495.90 40.05 493.72 32.10 487.00 C 26.79 482.51 25.88 481.18 22.67 475.68 C 19.47 470.19 18.11 468.82 18.01 462.83 C 16.36 362.26 16.48 288.92 17.96 188.32 C 18.05 182.33 18.72 180.78 22.25 175.41 C 27.56 167.35 28.97 165.39 37.31 158.95 C 45.65 152.51 48.15 151.29 58.79 147.20 C 65.86 144.47 69.95 145.16 75.96 144.07 L 75.96 144.07 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 279.79 471.25 C 279.79 471.25 278.16 464.80 274.95 460.69 C 271.72 456.56 270.85 455.00 265.87 453.41 C 258.50 451.06 256.33 450.92 248.73 452.34 C 243.61 453.30 242.71 454.92 238.87 458.47 C 236.95 460.24 236.83 461.15 236.39 463.73 C 234.63 474.23 233.84 488.47 233.84 488.47 C 233.84 488.47 232.86 464.77 227.69 447.69 C 226.15 442.60 223.69 442.26 219.08 439.66 C 214.51 437.07 213.10 436.70 207.86 436.49 C 202.63 436.27 201.14 436.42 196.44 438.74 C 191.71 441.08 191.26 442.67 187.61 446.51 C 185.80 448.41 184.87 448.79 184.39 451.38 C 182.56 461.36 182.38 475.00 182.38 475.00 C 182.38 475.00 182.67 425.15 181.05 392.23 C 180.79 386.94 180.55 385.42 177.75 380.93 C 174.95 376.45 173.76 375.43 169.07 373.04 C 164.38 370.66 162.88 370.60 157.63 370.70 C 152.46 370.80 151.05 371.05 146.48 373.47 C 141.83 375.93 140.78 376.94 137.73 381.24 C 134.69 385.55 133.45 386.82 133.29 392.11 C 131.36 454.03 131.91 491.80 132.24 558.15 C 132.30 568.78 131.24 571.49 134.23 581.68 C 135.73 586.79 141.80 590.72 141.80 590.72 C 141.80 590.72 130.86 576.53 119.53 567.59 C 115.41 564.34 113.57 563.87 108.35 564.33 C 100.62 565.03 98.60 565.84 92.07 570.06 C 87.66 572.93 87.19 574.62 85.03 579.44 C 82.88 584.26 82.72 585.67 82.73 590.95 C 82.75 596.26 83.30 597.52 85.10 602.50 C 86.01 605.00 86.81 605.30 88.64 607.23 C 109.98 629.67 120.73 642.56 146.08 666.64 C 151.86 672.12 153.79 672.81 161.07 676.01 C 170.76 680.27 173.12 680.97 183.48 683.08 C 193.85 685.19 196.31 685.10 206.88 685.36 C 222.75 685.75 226.37 686.27 242.15 684.54 C 252.65 683.38 254.99 682.47 264.97 678.98 C 272.47 676.36 274.10 675.40 280.75 671.05 C 289.62 665.24 291.57 663.79 299.30 656.52 C 305.10 651.06 306.65 649.83 310.65 642.92 C 318.64 629.11 320.16 625.78 325.74 610.82 C 328.53 603.34 328.89 601.37 329.13 593.38 C 330.32 554.08 332.56 536.74 329.14 498.52 C 328.44 490.73 325.55 488.93 319.37 484.19 C 313.17 479.45 310.60 480.29 303.01 478.53 C 300.45 477.94 299.56 477.92 297.18 479.05 C 292.46 481.30 290.88 481.63 287.72 485.82 C 283.24 491.76 280.75 500.85 280.75 500.85 L 279.79 471.25 L 279.79 471.25 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <g transform="translate(40, 0)">
                <path d="M 620.26 463.61 C 620.26 463.61 666.22 464.31 698.95 463.57 C 705.68 463.42 707.44 463.81 713.76 461.48 C 721.65 458.59 724.29 458.40 729.97 452.17 C 737.89 443.49 739.55 440.75 742.96 429.46 C 747.85 413.24 747.50 409.08 748.08 392.13 C 749.78 342.85 749.23 327.40 748.01 282.56 C 747.78 274.08 747.07 272.13 744.61 264.02 C 742.15 255.90 741.52 253.98 737.15 246.73 C 732.77 239.49 731.47 237.93 725.34 232.11 C 719.22 226.29 717.59 225.08 710.16 221.11 C 701.24 216.34 699.21 214.67 689.28 212.83 C 671.09 209.45 666.80 209.46 648.31 209.63 C 638.21 209.72 635.98 210.94 626.17 213.40 C 619.63 215.03 618.18 215.66 612.14 218.68 C 604.60 222.46 602.84 223.31 596.13 228.43 C 590.76 232.54 589.15 233.35 585.48 239.05 C 578.17 250.40 576.57 253.15 572.01 265.88 C 569.15 273.86 569.57 276.05 569.19 284.53 C 568.15 308.31 568.86 337.43 568.86 337.43 C 568.86 337.43 568.36 370.69 569.39 397.88 C 569.77 408.06 569.69 410.45 571.98 420.37 C 574.28 430.28 574.93 432.61 579.51 441.67 C 582.57 447.70 583.64 449.10 588.75 453.49 C 593.86 457.88 595.39 458.75 601.78 460.80 C 609.79 463.38 613.79 462.63 620.26 463.61 L 620.26 463.61 Z" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 569.11 463.61 C 569.11 463.61 580.46 449.77 592.72 442.61 C 601.66 437.38 604.62 437.03 614.95 436.80 C 623.43 436.61 625.73 437.57 633.16 441.70 C 646.31 448.99 659.93 461.76 659.93 461.76 C 659.93 461.76 667.80 453.11 675.23 447.17 C 679.68 443.61 680.90 442.98 686.15 440.78 C 691.82 438.40 693.19 437.82 699.29 437.08 C 704.94 436.39 706.49 435.95 711.92 437.66 C 721.40 440.64 723.63 441.61 731.80 447.30 C 739.60 452.74 746.95 462.07 746.95 462.07" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 601.08 303.07 C 601.08 303.07 602.18 312.46 606.96 317.65 C 611.21 322.25 613.57 321.89 619.66 323.21 C 622.89 323.90 623.87 323.28 626.89 321.94 C 630.66 320.28 632.15 320.15 634.39 316.68 C 638.09 310.97 639.74 309.26 639.53 302.44 C 639.32 295.63 638.45 293.23 633.53 288.56 C 628.45 283.73 626.02 282.88 619.04 282.97 C 612.81 283.06 610.69 284.27 606.52 288.93 C 601.99 294.00 601.08 303.07 601.08 303.07 L 601.08 303.07 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 677.80 302.87 C 677.80 302.87 678.90 312.26 683.68 317.45 C 687.93 322.05 690.29 321.69 696.39 323.00 C 699.62 323.70 700.59 323.08 703.62 321.74 C 707.38 320.07 708.87 319.95 711.12 316.48 C 714.82 310.77 716.46 309.05 716.25 302.24 C 716.04 295.43 715.18 293.03 710.26 288.35 C 705.17 283.53 702.74 282.68 695.76 282.77 C 689.53 282.86 687.41 284.06 683.24 288.73 C 678.71 293.80 677.80 302.87 677.80 302.87 L 677.80 302.87 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
            </g>        </svg>
    ),

    TableInstruction: ({ size = 120, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs></defs>
            <path d="M 198.51 92.43 C 225.51 92.43 231.51 92.43 258.51 92.43 C 285.51 92.43 291.51 92.43 318.51 92.43 C 345.51 92.43 351.51 92.43 378.51 92.43 C 405.51 92.43 411.51 92.43 438.51 92.43 C 465.51 92.43 471.51 92.43 498.51 92.43 C 525.51 92.43 531.51 92.43 558.51 92.43 C 585.51 92.43 618.51 125.43 618.51 152.43 C 618.51 179.43 618.51 185.43 618.51 212.43 C 618.51 239.43 618.51 245.43 618.51 272.43 C 618.51 299.43 618.51 305.43 618.51 332.43 C 618.51 359.43 618.51 365.43 618.51 392.43 C 618.51 419.43 618.51 425.43 618.51 452.43 C 618.51 479.43 618.51 485.43 618.51 512.43 C 618.51 539.43 585.51 572.43 558.51 572.43 C 531.51 572.43 525.51 572.43 498.51 572.43 C 471.51 572.43 465.51 572.43 438.51 572.43 C 411.51 572.43 405.51 572.43 378.51 572.43 C 351.51 572.43 345.51 572.43 318.51 572.43 C 291.51 572.43 285.51 572.43 258.51 572.43 C 231.51 572.43 225.51 572.43 198.51 572.43 C 171.51 572.43 138.51 539.43 138.51 512.43 C 138.51 485.43 138.51 479.43 138.51 452.43 C 138.51 425.43 138.51 419.43 138.51 392.43 C 138.51 365.43 138.51 359.43 138.51 332.43 C 138.51 305.43 138.51 299.43 138.51 272.43 C 138.51 245.43 138.51 239.43 138.51 212.43 C 138.51 185.43 138.51 179.43 138.51 152.43 C 138.51 125.43 171.51 92.43 198.51 92.43 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 298.51 92.43 L 298.51 572.43" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 458.51 92.43 L 458.51 572.43" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 580.70 452.98 C 580.70 452.98 578.17 444.23 573.17 438.65 C 568.15 433.04 566.80 430.92 559.06 428.77 C 547.61 425.59 544.23 425.39 532.42 427.32 C 524.45 428.63 523.07 430.82 517.09 435.64 C 514.11 438.04 513.92 439.27 513.24 442.77 C 510.51 457.02 509.27 476.35 509.27 476.35 C 509.27 476.35 507.74 444.19 499.71 421.00 C 497.32 414.10 493.49 413.64 486.34 410.11 C 479.22 406.60 477.03 406.09 468.88 405.80 C 460.75 405.52 458.45 405.71 451.14 408.86 C 443.78 412.04 443.09 414.20 437.41 419.40 C 434.59 421.98 433.15 422.50 432.41 426.02 C 429.57 439.56 429.28 458.07 429.28 458.07 C 429.28 458.07 429.73 390.42 427.21 345.74 C 426.80 338.56 426.43 336.50 422.08 330.42 C 417.73 324.33 415.89 322.95 408.59 319.71 C 401.30 316.47 398.97 316.40 390.80 316.53 C 382.77 316.67 380.58 317.00 373.47 320.29 C 366.25 323.63 364.62 324.99 359.88 330.84 C 355.14 336.68 353.22 338.41 352.97 345.59 C 349.98 429.61 350.83 480.87 351.35 570.91 C 351.43 585.33 349.79 589.01 354.43 602.84 C 356.76 609.77 366.19 615.10 366.19 615.10 C 366.19 615.10 349.20 595.85 331.59 583.72 C 325.17 579.31 322.31 578.66 314.20 579.30 C 302.19 580.24 299.05 581.34 288.90 587.08 C 282.04 590.96 281.31 593.25 277.96 599.80 C 274.61 606.34 274.36 608.25 274.39 615.42 C 274.41 622.63 275.26 624.33 278.07 631.10 C 279.48 634.49 280.72 634.90 283.56 637.50 C 316.74 667.97 333.45 685.46 372.85 718.13 C 381.84 725.57 384.84 726.51 396.15 730.85 C 411.21 736.63 414.89 737.57 430.99 740.44 C 447.11 743.31 450.93 743.18 467.37 743.54 C 492.04 744.07 497.66 744.77 522.19 742.42 C 538.52 740.85 542.15 739.62 557.67 734.88 C 569.32 731.33 571.85 730.02 582.20 724.11 C 595.98 716.24 599.02 714.26 611.03 704.40 C 620.04 696.99 622.46 695.32 628.67 685.95 C 641.09 667.21 643.45 662.69 652.12 642.38 C 656.46 632.23 657.02 629.56 657.39 618.72 C 659.25 565.38 662.73 541.85 657.42 489.99 C 656.33 479.41 651.83 476.97 642.22 470.54 C 632.59 464.11 628.59 465.24 616.80 462.86 C 612.81 462.05 611.44 462.03 607.73 463.57 C 600.40 466.62 597.94 467.07 593.03 472.75 C 586.06 480.82 582.19 493.15 582.19 493.15 L 580.70 452.98 L 580.70 452.98 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),


    GhostHighlight: ({ size = 120, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs></defs>
            <g transform="translate(400, 400) scale(0.9) translate(-430, -400)">
                <path d="M 75.96 144.07 C 75.96 144.07 292.81 141.98 423.10 144.07 C 434.94 144.26 437.92 145.59 448.21 150.02 C 458.59 154.49 460.02 156.67 467.97 163.39 C 473.28 167.89 474.19 169.21 477.39 174.71 C 480.59 180.20 481.95 181.57 482.05 187.56 C 483.70 288.14 485.04 359.40 482.10 462.07 C 481.85 471.01 479.58 473.15 473.67 480.90 C 467.71 488.71 465.05 489.92 456.23 496.00 C 450.33 500.05 448.62 500.84 441.28 503.20 C 433.97 505.55 432.06 506.26 424.11 506.33 C 296.60 507.42 207.26 508.41 76.97 506.33 C 65.13 506.14 62.14 504.80 51.86 500.37 C 41.48 495.90 40.05 493.72 32.10 487.00 C 26.79 482.51 25.88 481.18 22.67 475.68 C 19.47 470.19 18.11 468.82 18.01 462.83 C 16.36 362.26 16.48 288.92 17.96 188.32 C 18.05 182.33 18.72 180.78 22.25 175.41 C 27.56 167.35 28.97 165.39 37.31 158.95 C 45.65 152.51 48.15 151.29 58.79 147.20 C 65.86 144.47 69.95 145.16 75.96 144.07 L 75.96 144.07 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="11.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 279.79 471.25 C 279.79 471.25 278.16 464.80 274.95 460.69 C 271.72 456.56 270.85 455.00 265.87 453.41 C 258.50 451.06 256.33 450.92 248.73 452.34 C 243.61 453.30 242.71 454.92 238.87 458.47 C 236.95 460.24 236.83 461.15 236.39 463.73 C 234.63 474.23 233.84 488.47 233.84 488.47 C 233.84 488.47 232.86 464.77 227.69 447.69 C 226.15 442.60 223.69 442.26 219.08 439.66 C 214.51 437.07 213.10 436.70 207.86 436.49 C 202.63 436.27 201.14 436.42 196.44 438.74 C 191.71 441.08 191.26 442.67 187.61 446.51 C 185.80 448.41 184.87 448.79 184.39 451.38 C 182.56 461.36 182.38 475.00 182.38 475.00 C 182.38 475.00 182.67 425.15 181.05 392.23 C 180.79 386.94 180.55 385.42 177.75 380.93 C 174.95 376.45 173.76 375.43 169.07 373.04 C 164.38 370.66 162.88 370.60 157.63 370.70 C 152.46 370.80 151.05 371.05 146.48 373.47 C 141.83 375.93 140.78 376.94 137.73 381.24 C 134.69 385.55 133.45 386.82 133.29 392.11 C 131.36 454.03 131.91 491.80 132.24 558.15 C 132.30 568.78 131.24 571.49 134.23 581.68 C 135.73 586.79 141.80 590.72 141.80 590.72 C 141.80 590.72 130.86 576.53 119.53 567.59 C 115.41 564.34 113.57 563.87 108.35 564.33 C 100.62 565.03 98.60 565.84 92.07 570.06 C 87.66 572.93 87.19 574.62 85.03 579.44 C 82.88 584.26 82.72 585.67 82.73 590.95 C 82.75 596.26 83.30 597.52 85.10 602.50 C 86.01 605.00 86.81 605.30 88.64 607.23 C 109.98 629.67 120.73 642.56 146.08 666.64 C 151.86 672.12 153.79 672.81 161.07 676.01 C 170.76 680.27 173.12 680.97 183.48 683.08 C 193.85 685.19 196.31 685.10 206.88 685.36 C 222.75 685.75 226.37 686.27 242.15 684.54 C 252.65 683.38 254.99 682.47 264.97 678.98 C 272.47 676.36 274.10 675.40 280.75 671.05 C 289.62 665.24 291.57 663.79 299.30 656.52 C 305.10 651.06 306.65 649.83 310.65 642.92 C 318.64 629.11 320.16 625.78 325.74 610.82 C 328.53 603.34 328.89 601.37 329.13 593.38 C 330.32 554.08 332.56 536.74 329.14 498.52 C 328.44 490.73 325.55 488.93 319.37 484.19 C 313.17 479.45 310.60 480.29 303.01 478.53 C 300.45 477.94 299.56 477.92 297.18 479.05 C 292.46 481.30 290.88 481.63 287.72 485.82 C 283.24 491.76 280.75 500.85 280.75 500.85 L 279.79 471.25 L 279.79 471.25 Z" fill="#ffffff" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g transform="translate(30, 0)">
                <path d="M 620.26 463.61 C 620.26 463.61 666.22 464.31 698.95 463.57 C 705.68 463.42 707.44 463.81 713.76 461.48 C 721.65 458.59 724.29 458.40 729.97 452.17 C 737.89 443.49 739.55 440.75 742.96 429.46 C 747.85 413.24 747.50 409.08 748.08 392.13 C 749.78 342.85 749.23 327.40 748.01 282.56 C 747.78 274.08 747.07 272.13 744.61 264.02 C 742.15 255.90 741.52 253.98 737.15 246.73 C 732.77 239.49 731.47 237.93 725.34 232.11 C 719.22 226.29 717.59 225.08 710.16 221.11 C 701.24 216.34 699.21 214.67 689.28 212.83 C 671.09 209.45 666.80 209.46 648.31 209.63 C 638.21 209.72 635.98 210.94 626.17 213.40 C 619.63 215.03 618.18 215.66 612.14 218.68 C 604.60 222.46 602.84 223.31 596.13 228.43 C 590.76 232.54 589.15 233.35 585.48 239.05 C 578.17 250.40 576.57 253.15 572.01 265.88 C 569.15 273.86 569.57 276.05 569.19 284.53 C 568.15 308.31 568.86 337.43 568.86 337.43 C 568.86 337.43 568.36 370.69 569.39 397.88 C 569.77 408.06 569.69 410.45 571.98 420.37 C 574.28 430.28 574.93 432.61 579.51 441.67 C 582.57 447.70 583.64 449.10 588.75 453.49 C 593.86 457.88 595.39 458.75 601.78 460.80 C 609.79 463.38 613.79 462.63 620.26 463.61 L 620.26 463.61 Z" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 569.11 463.61 C 569.11 463.61 580.46 449.77 592.72 442.61 C 601.66 437.38 604.62 437.03 614.95 436.80 C 623.43 436.61 625.73 437.57 633.16 441.70 C 646.31 448.99 659.93 461.76 659.93 461.76 C 659.93 461.76 667.80 453.11 675.23 447.17 C 679.68 443.61 680.90 442.98 686.15 440.78 C 691.82 438.40 693.19 437.82 699.29 437.08 C 704.94 436.39 706.49 435.95 711.92 437.66 C 721.40 440.64 723.63 441.61 731.80 447.30 C 739.60 452.74 746.95 462.07 746.95 462.07" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 601.08 303.07 C 601.08 303.07 602.18 312.46 606.96 317.65 C 611.21 322.25 613.57 321.89 619.66 323.21 C 622.89 323.90 623.87 323.28 626.89 321.94 C 630.66 320.28 632.15 320.15 634.39 316.68 C 638.09 310.97 639.74 309.26 639.53 302.44 C 639.32 295.63 638.45 293.23 633.53 288.56 C 628.45 283.73 626.02 282.88 619.04 282.97 C 612.81 283.06 610.69 284.27 606.52 288.93 C 601.99 294.00 601.08 303.07 601.08 303.07 L 601.08 303.07 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 677.80 302.87 C 677.80 302.87 678.90 312.26 683.68 317.45 C 687.93 322.05 690.29 321.69 696.39 323.00 C 699.62 323.70 700.59 323.08 703.62 321.74 C 707.38 320.07 708.87 319.95 711.12 316.48 C 714.82 310.77 716.46 309.05 716.25 302.24 C 716.04 295.43 715.18 293.03 710.26 288.35 C 705.17 283.53 702.74 282.68 695.76 282.77 C 689.53 282.86 687.41 284.06 683.24 288.73 C 678.71 293.80 677.80 302.87 677.80 302.87 L 677.80 302.87 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    ),

    TableColumnsInstruction: ({ size = 120, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs></defs>
            <path d="M 200.76 125.39 C 233.19 125.39 240.39 125.39 272.82 125.39 C 305.25 125.39 312.46 125.39 344.89 125.39 C 377.32 125.39 384.52 125.39 416.95 125.39 C 449.38 125.39 456.59 125.39 489.02 125.39 C 521.44 125.39 528.65 125.39 561.08 125.39 C 593.51 125.39 600.72 125.39 633.14 125.39 C 665.57 125.39 705.21 163.50 705.21 194.68 C 705.21 225.86 705.21 232.79 705.21 263.97 C 705.21 295.15 705.21 302.08 705.21 333.25 C 705.21 364.43 705.21 371.36 705.21 402.54 C 705.21 433.72 705.21 440.65 705.21 471.83 C 705.21 503.01 705.21 509.94 705.21 541.12 C 705.21 572.30 705.21 579.23 705.21 610.41 C 705.21 641.59 665.57 679.70 633.14 679.70 C 600.72 679.70 593.51 679.70 561.08 679.70 C 528.65 679.70 521.44 679.70 489.02 679.70 C 456.59 679.70 449.38 679.70 416.95 679.70 C 384.52 679.70 377.32 679.70 344.89 679.70 C 312.46 679.70 305.25 679.70 272.82 679.70 C 240.39 679.70 233.19 679.70 200.76 679.70 C 168.33 679.70 128.69 641.59 128.69 610.41 C 128.69 579.23 128.69 572.30 128.69 541.12 C 128.69 509.94 128.69 503.01 128.69 471.83 C 128.69 440.65 128.69 433.72 128.69 402.54 C 128.69 371.36 128.69 364.43 128.69 333.25 C 128.69 302.08 128.69 295.15 128.69 263.97 C 128.69 232.79 128.69 225.86 128.69 194.68 C 128.69 163.50 168.33 125.39 200.76 125.39 Z" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 128.69 268.59 L 705.21 268.59" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 320.86 125.39 L 320.86 679.70" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 513.04 125.39 L 513.04 679.70" fill="none" fillOpacity="1" stroke="#444444" strokeWidth="11.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 181.12 206.59 L 270.70 206.59 L 270.70 223.23 L 181.12 223.23 L 181.12 206.59 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 372.61 205.96 L 462.19 205.96 L 462.19 222.81 L 372.61 222.81 L 372.61 205.96 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 566.27 206.97 L 655.85 206.97 L 655.85 223.81 L 566.27 223.81 L 566.27 206.97 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 180.51 357.49 L 270.09 357.49 L 270.09 370.58 L 180.51 370.58 L 180.51 357.49 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 565.98 357.68 L 655.56 357.68 L 655.56 370.77 L 565.98 370.77 L 565.98 357.68 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 567.06 407.26 L 656.64 407.26 L 656.64 420.35 L 567.06 420.35 L 567.06 407.26 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 373.48 359.73 L 463.06 359.73 L 463.06 372.82 L 373.48 372.82 L 373.48 359.73 Z" fill="#444444" fillOpacity="1" stroke="#444444" strokeWidth="11.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    ),
    Share: (p) => <Icon {...p} path={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>} />,
    WordCasingCorrection: (p) => (
        <svg width={p.size || 48} height={(p.size || 48) * 0.5} viewBox="0 0 120 60" fill="none" className={p.className}>
            {/* Uppercase gray D */}
            <path
                d="M 10 10 V 50 H 22 C 48 50 48 10 22 10 Z M 20 18 H 22 C 38 18 38 42 22 42 H 20 Z"
                fill="#9ca3af"
            />
            {/* Lowercase red d (overlapping) */}
            <path
                d="M 12 40 a 11 11 0 1 0 22 0 a 11 11 0 1 0 -22 0 M 34 10 v 40"
                stroke="#ef4444"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
            />
            {/* Lowercase black a (round body, short stem) */}
            <path
                d="M 52 40 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0 M 72 32 v 18"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
            />
            {/* Lowercase black s (aligned with a, smooth curves) */}
            <path
                d="M 102 34 C 102 27 88 27 88 34 C 88 40 102 40 102 46 C 102 53 88 53 88 46"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    ),
    SortByColorColumns: (p) => <Icon {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" path={<>
        <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
        <line x1="9" y1="4" x2="9" y2="20" strokeWidth="2" />
        <line x1="15" y1="4" x2="15" y2="20" strokeWidth="2" />
        <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2" />
        <rect x="4" y="5" width="4" height="3" fill="#3b82f6" stroke="none" rx="0.5" />
        <rect x="10" y="5" width="4" height="3" fill="#ef4444" stroke="none" rx="0.5" />
        <rect x="16" y="5" width="4" height="3" fill="#22c55e" stroke="none" rx="0.5" />
    </>} />,
    SyllableCasingCorrection: (p) => (
        <svg width={p.size || 48} height={(p.size || 48) * 0.5} viewBox="0 0 100 60" fill="none" className={p.className}>
            <g transform="translate(50, 30) scale(1.55) translate(-36.5, -30)">
                {/* Uppercase gray M */}
                <path
                    d="M 10 50 V 10 L 22 35 L 34 10 V 50"
                    stroke="#9ca3af"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Lowercase red m (overlapping) */}
                <path
                    d="M 12 50 V 30 a 5 5 0 0 1 10 0 V 50 m 0 -20 a 5 5 0 0 1 10 0 V 50"
                    stroke="#ef4444"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Lowercase black a (round body, short stem) */}
                <path
                    d="M 45 40 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 M 63 32 v 18"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    ),
};
