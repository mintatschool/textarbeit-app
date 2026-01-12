import React from 'react';

const Icon = ({ path, size = 24, className = "", viewBox = "0 0 24 24", ...props }) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className} style={{ transformBox: 'fill-box' }} {...props}>{path}</svg>
);

export const Icons = {
    Edit2: (p) => <Icon {...p} path={<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />} />,
    RotateCcw: (p) => <Icon {...p} path={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>} />,
    List: (p) => <Icon {...p} path={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />,
    Table: (p) => <Icon {...p} path={<><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="9" y1="6" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="18" /></>} />,

    // Menü-Icons
    MenuSyllables: (p) => <Icon {...p} path={<><line x1="4" y1="12" x2="9" y2="12" strokeWidth="4" /><line x1="15" y1="12" x2="20" y2="12" strokeWidth="4" /></>} />,
    MenuWords: (p) => <Icon {...p} path={<><line x1="4" y1="12" x2="20" y2="12" strokeWidth="4" /></>} />,
    MenuSentences: (p) => <Icon {...p} path={<><line x1="3" y1="8" x2="8" y2="8" strokeWidth="3" /><line x1="10" y1="8" x2="16" y2="8" strokeWidth="3" /><line x1="18" y1="8" x2="21" y2="8" strokeWidth="3" /><line x1="3" y1="16" x2="12" y2="16" strokeWidth="3" /><circle cx="20" cy="16" r="2" fill="currentColor" stroke="none" /></>} />,
    MenuSentenceCategory: (p) => <Icon {...p} path={<><line x1="4" y1="11" x2="16" y2="11" strokeWidth="3" /><line x1="4" y1="16" x2="12" y2="16" strokeWidth="3" /><circle cx="19" cy="16" r="1.5" fill="currentColor" /></>} />,
    TextParagraph: (p) => <Icon {...p} path={<><line x1="4" y1="4" x2="20" y2="4" strokeWidth="2" /><line x1="4" y1="8" x2="20" y2="8" strokeWidth="2" /><line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" /><line x1="4" y1="16" x2="20" y2="16" strokeWidth="2" /><line x1="4" y1="20" x2="12" y2="20" strokeWidth="2" /></>} />,

    // Untermenü-Icons
    Grid2x2: (p) => <Icon {...p} path={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>} />,
    Puzzle: (p) => <Icon {...p} path={<path d="M20.5 11H18V7c0-1.1-.9-2-2-2h-4V3.5C12 2.12 10.88 1 9.5 1S7 2.12 7 3.5V5H3c-1.1 0-2 .9-2 2v4h1.5C3.88 11 5 12.12 5 13.5S3.88 16 2.5 16H1v4c0 1.1.9 2 2 2h4v-1.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5V22h4c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />} />,
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
    Pen: (p) => <Icon {...p} path={<path d="M18 13.29V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.71M12 2.766a2.001 2.001 0 0 1 2.828 0l2.406 2.406a2.001 2.001 0 0 1 0 2.828L9 16.242 4.758 17.656a.5.5 0 0 1-.614-.614L5.516 12 13.793 3.723z" />} />,

    // View/Edit Mode
    Eye: (p) => <Icon {...p} path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />,
    Camera: (p) => <Icon {...p} path={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>} />,
    Trash2: (p) => <Icon {...p} path={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>} />,
    ChevronDown: (p) => <Icon {...p} path={<polyline points="6 9 12 15 18 9" />} />,
    Check: (p) => <Icon {...p} path={<polyline points="20 6 9 17 4 12" />} />,
    X: (p) => <Icon {...p} path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />,
    Download: (p) => <Icon {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} />,
    Upload: (p) => <Icon {...p} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>} />,
    Image: (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />,
    Arcs: (p) => <Icon {...p} path={<><path d="M7 16c2-4 5-4 7 0" /><path d="M13 16c2-4 5-4 7 0" /></>} />,
    Printer: (p) => <Icon {...p} path={<><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></>} />,
    Volume2: (p) => <Icon {...p} path={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></>} />,
    Play: (p) => <Icon {...p} path={<><polygon points="5 3 19 12 5 21 5 3"></polygon></>} />,
    Shuffle: (p) => <Icon {...p} path={<><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></>} />,
    Clock: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
    ArrowRight: (p) => <Icon {...p} path={<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>} />,
    HelpCircle: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
    Empty: (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>} />,
    Search: (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />,
    Move: (p) => <Icon {...p} path={<><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></>} />,
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
    LetterMarkerInstruction: (p) => <Icon {...p} size={p.size || 24} path={<g>
        {/* Yellow Box with Black Border */}
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#fde047" stroke="black" strokeWidth="2" />
        {/* 'A' - drawn first so hand covers it */}
        <path d="M9 17L12 7L15 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="14" x2="14" y2="14" stroke="black" strokeWidth="2.5" strokeLinecap="round" />

        {/* Hand - Solid White Foreground using Closed Path Hull */}
        <g transform="translate(10, 8.5) scale(0.6)" fill="white" stroke="black" strokeWidth="2.5" strokeLinejoin="round">
            {/* Main Hull: Fingers (Extended) + Palm + Thumb (Extended) */}
            {/* Fingers: lowered top Y values (5, 3, 5, 7) to make them longer */}
            {/* Thumb: extended diagonal l -3.6 -> -4.5 */}
            <path
                d="M 6 11 V 5 a 2 2 0 0 1 4 0 V 3 a 2 2 0 0 1 4 0 V 5 a 2 2 0 0 1 4 0 V 7 a 2 2 0 1 1 4 0 v 6 a 8 8 0 0 1 -8 8 h -2 c -2.8 0 -4.5 -0.86 -5.99 -2.34 l -4.5 -4.5 a 2 2 0 0 1 2.83 -2.82 L 6 11 Z"
            />
            {/* Finger Separators - extended to match new finger lengths */}
            <path d="M 10 5 V 10.5" strokeLinecap="round" />
            <path d="M 14 5 V 10" strokeLinecap="round" />
            <path d="M 18 7 V 10" strokeLinecap="round" />
        </g>
    </g>} />,
    LetterCaseToggle: (p) => <Icon {...p} size={p.size || 24} path={<g>
        {/* Uppercase A */}
        <path d="M4 19L7.5 7L11 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="5.5" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* Slash / */}
        <line x1="14" y1="19" x2="17" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lowercase a */}
        <circle cx="21" cy="15.5" r="2.5" stroke="currentColor" strokeWidth="2.5" />
        <line x1="23.5" y1="12" x2="23.5" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
    Dice5: (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M16 8h.01" strokeWidth="3" /><path d="M8 8h.01" strokeWidth="3" /><path d="M8 16h.01" strokeWidth="3" /><path d="M16 16h.01" strokeWidth="3" /><path d="M12 12h.01" strokeWidth="3" /></>} />,
    Zap: (p) => <Icon {...p} path={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
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
    Highlighter: (p) => <Icon {...p} path={<><path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /><line x1="12" y1="2" x2="16" y2="6" /></>} />,
    Eraser: (p) => <Icon {...p} path={<><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L11 20" /><path d="M17 2L21 6" /><path d="M7 20l10-10" /></>} />,
    Link: (p) => <Icon {...p} path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>} />,
    File: (p) => <Icon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>} />,
    Files: (p) => <Icon {...p} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /></>} />,
    FileText: (p) => <Icon {...p} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>} />,
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
    )
};
