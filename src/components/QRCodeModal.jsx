import React, { useRef, useState, useMemo, useEffect } from 'react';
import QRious from 'qrious';
import { Icons } from './Icons';

// Grenze für Multi-QR (in Zeichen)
const MULTI_QR_THRESHOLD = 800;

export const QRCodeModal = ({ text, onClose }) => {
    const qrRef = useRef(null);
    const qrRef2 = useRef(null); // Zweiter QR-Code für Multi-Part
    const fullQrRef = useRef(null);
    const fullQrRef2 = useRef(null);
    const [linkInput, setLinkInput] = useState("");
    const [isMaximized, setIsMaximized] = useState(false);
    const [tooLongError, setTooLongError] = useState(false);
    const [mode, setMode] = useState('raw'); // Standard auf 'raw' für maximale Kompatibilität

    // UTF-8 Encoding Fix für Umlaute
    const toUtf8Bytes = (str) => {
        try {
            return unescape(encodeURIComponent(str));
        } catch (e) {
            return str;
        }
    };

    const [showHashes, setShowHashes] = useState(false);

    // Parsing Input Data
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(text);
        } catch (e) {
            return { text: text }; // Fallback if plain text passed
        }
    }, [text]);

    // Ermitteln ob Multi-QR benötigt wird
    const { qrValues, isMultiPart, errorLevel } = useMemo(() => {
        if (!parsedData || !parsedData.text) {
            return { qrValues: [], isMultiPart: false, errorLevel: 'M' };
        }

        let contentToEncode = text;

        if (mode === 'raw') {
            contentToEncode = parsedData.text || text;
        }

        // Feature: Markierungen als # exportieren
        if (showHashes && parsedData.highlights && Array.isArray(parsedData.highlights) && parsedData.highlights.length > 0) {
            const rawText = parsedData.text;
            const highlights = new Set(parsedData.highlights);

            const segments = rawText.split(/(\s+)/);
            let currentIndex = 0;
            let stringWithHashes = "";

            segments.forEach(segment => {
                const match = segment.match(/^([^\w\u00C0-\u017F]*)(\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);

                if (match) {
                    const prefix = match[1];
                    const cleanWord = match[2];
                    const suffix = match[3];
                    const wordStartIndex = currentIndex + prefix.length;
                    const isHighlighted = highlights.has(wordStartIndex);

                    if (isHighlighted) {
                        stringWithHashes += prefix + "#" + cleanWord + suffix;
                    } else {
                        stringWithHashes += segment;
                    }
                } else {
                    stringWithHashes += segment;
                }
                currentIndex += segment.length;
            });

            contentToEncode = stringWithHashes;
        }

        // Standard behavior für mode !== 'raw'
        if (mode !== 'raw' && !showHashes) {
            contentToEncode = contentToEncode.length > 300
                ? contentToEncode
                : (contentToEncode.startsWith('{') ? contentToEncode : JSON.stringify({ text: contentToEncode }));
        }

        const finalContent = toUtf8Bytes(contentToEncode);

        // Check ob Multi-QR benötigt wird
        if (finalContent.length > MULTI_QR_THRESHOLD) {
            // Aufteilen in zwei Teile
            const halfLength = Math.ceil(finalContent.length / 2);
            const part1 = finalContent.substring(0, halfLength);
            const part2 = finalContent.substring(halfLength);

            // Multi-Part Format: { p: part, t: total, d: data }
            const qr1 = JSON.stringify({ p: 1, t: 2, d: part1 });
            const qr2 = JSON.stringify({ p: 2, t: 2, d: part2 });

            // Prüfen ob die Teile noch zu lang sind
            if (qr1.length > 2000 || qr2.length > 2000) {
                return { qrValues: [], isMultiPart: false, errorLevel: 'M', tooLong: true };
            }

            return {
                qrValues: [qr1, qr2],
                isMultiPart: true,
                errorLevel: 'M' // Medium für Multi-Part
            };
        }

        // Einzelner QR-Code
        if (finalContent.length > 2900) {
            return { qrValues: [], isMultiPart: false, errorLevel: 'M', tooLong: true };
        }

        // Fehlerkorrektur: 'M' für kurze Texte (robuster), 'L' für längere
        const errLevel = finalContent.length < 500 ? 'M' : 'L';

        return { qrValues: [finalContent], isMultiPart: false, errorLevel: errLevel };
    }, [text, parsedData, showHashes, mode]);

    // Update tooLongError state
    useEffect(() => {
        setTooLongError(qrValues.length === 0 && mode !== 'link');
    }, [qrValues, mode]);

    // QR-Code 1 rendern
    useEffect(() => {
        if (mode === 'link') return;
        if (qrRef.current && qrValues[0] && !isMaximized && !tooLongError) {
            try {
                new QRious({
                    element: qrRef.current,
                    value: qrValues[0],
                    size: 1000,
                    level: errorLevel,
                    padding: 16 // Quiet Zone für bessere Erkennung
                });
            } catch (e) {
                console.error("QR Generierung fehlgeschlagen:", e);
                setTooLongError(true);
            }
        }
    }, [qrValues, isMaximized, tooLongError, mode, errorLevel]);

    // QR-Code 2 rendern (nur bei Multi-Part)
    useEffect(() => {
        if (mode === 'link') return;
        if (qrRef2.current && qrValues[1] && !isMaximized && !tooLongError) {
            try {
                new QRious({
                    element: qrRef2.current,
                    value: qrValues[1],
                    size: 1000,
                    level: errorLevel,
                    padding: 16
                });
            } catch (e) {
                console.error("QR 2 Generierung fehlgeschlagen:", e);
            }
        }
    }, [qrValues, isMaximized, tooLongError, mode, errorLevel]);

    // Maximierte Ansicht
    useEffect(() => {
        if (!isMaximized || tooLongError) return;

        const size = Math.min(window.innerWidth, window.innerHeight) * (isMultiPart ? 0.4 : 0.85);
        const renderSize = Math.max(size * 2, 1200);

        if (fullQrRef.current && qrValues[0]) {
            try {
                new QRious({
                    element: fullQrRef.current,
                    value: mode === 'link' ? linkInput : qrValues[0],
                    size: renderSize,
                    level: errorLevel,
                    padding: 20
                });
            } catch (e) {
                console.error("QR Maximierung fehlgeschlagen:", e);
            }
        }

        if (fullQrRef2.current && qrValues[1]) {
            try {
                new QRious({
                    element: fullQrRef2.current,
                    value: qrValues[1],
                    size: renderSize,
                    level: errorLevel,
                    padding: 20
                });
            } catch (e) {
                console.error("QR 2 Maximierung fehlgeschlagen:", e);
            }
        }
    }, [qrValues, isMaximized, tooLongError, linkInput, mode, isMultiPart, errorLevel]);

    // QR-Code für Link-Eingabe generieren
    const generateLinkQR = () => {
        if (!linkInput || !qrRef.current) return;
        setMode('link');
        try {
            new QRious({
                element: qrRef.current,
                value: linkInput,
                size: 280,
                level: 'M',
                padding: 16
            });
        } catch (e) {
            console.error("Link QR fehlgeschlagen:", e);
        }
    };

    const textLength = parsedData?.text?.length || text?.length || 0;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            {/* Maximierte Vollbild-Ansicht */}
            {isMaximized && !tooLongError && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-4 animate-fadeIn">
                    <div className={`flex ${isMultiPart ? 'gap-6' : ''} items-center justify-center`}>
                        <div className="bg-white p-4 border-8 border-slate-100 rounded-2xl shadow-2xl flex flex-col items-center">
                            <canvas ref={fullQrRef} style={{ maxWidth: isMultiPart ? '40vw' : '100%', maxHeight: '70vh', objectFit: 'contain' }}></canvas>
                            {isMultiPart && (
                                <p className="mt-2 text-lg font-bold text-blue-600">① Zuerst scannen</p>
                            )}
                        </div>
                        {isMultiPart && qrValues[1] && (
                            <div className="bg-white p-4 border-8 border-slate-100 rounded-2xl shadow-2xl flex flex-col items-center">
                                <canvas ref={fullQrRef2} style={{ maxWidth: '40vw', maxHeight: '70vh', objectFit: 'contain' }}></canvas>
                                <p className="mt-2 text-lg font-bold text-green-600">② Dann scannen</p>
                            </div>
                        )}
                    </div>
                    <p className="mt-4 text-slate-500 font-medium">
                        {mode === 'link' ? 'Link-QR-Code' : (mode === 'raw' ? 'Nur Text' : 'Kompletter Status')}
                        {isMultiPart && ' (2 Teile)'}
                    </p>
                    <button
                        onClick={() => setIsMaximized(false)}
                        className="mt-6 px-8 py-3 bg-slate-800 text-white rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition min-touch-target"
                    >
                        <Icons.Minimize /> Verkleinern
                    </button>
                </div>
            )}

            {/* Normales Modal */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 modal-animate flex flex-col items-center max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scroll">
                <div className="flex justify-between items-center w-full mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Icons.QrCode className="text-blue-600" /> Text teilen
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full min-touch-target">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Tab-Umschalter */}
                <div className="flex w-full gap-2 mb-4">
                    <button
                        onClick={() => { setMode('text'); setLinkInput(""); }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${mode === 'text'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        📝 Alles
                    </button>
                    <button
                        onClick={() => { setMode('raw'); setLinkInput(""); }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${mode === 'raw'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        📄 Nur Text
                    </button>
                    <button
                        onClick={() => setMode('link')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${mode === 'link'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        🔗 Link
                    </button>
                </div>

                {/* Link-Eingabe (nur wenn mode === 'link') */}
                {mode === 'link' && (
                    <div className="w-full mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="text-sm font-bold text-slate-600 block mb-2">
                            Datei-Link (Cloud) für Schüler:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="https://..."
                                className="flex-1 border rounded-lg p-2 text-sm"
                                value={linkInput}
                                onChange={e => setLinkInput(e.target.value)}
                            />
                            <button
                                onClick={generateLinkQR}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 min-touch-target"
                            >
                                OK
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Füge hier den Link zu deiner exportierten JSON-Datei ein.
                        </p>
                    </div>
                )}

                {/* Multi-Part Hinweis */}
                {isMultiPart && mode !== 'link' && (
                    <div className="w-full mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                        <Icons.AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-amber-700">Langer Text erkannt</p>
                            <p className="text-xs text-amber-600 mt-1">
                                Der Text wurde auf 2 QR-Codes aufgeteilt. Bitte beide nacheinander scannen!
                            </p>
                        </div>
                    </div>
                )}

                {/* QR-Code Anzeige */}
                <div className="relative group w-full flex justify-center">
                    {tooLongError ? (
                        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center text-sm font-bold min-h-[280px] flex flex-col items-center justify-center gap-2">
                            <Icons.AlertTriangle size={48} className="text-red-400" />
                            <p>Der Text ist zu lang für QR-Codes.</p>
                            <p className="text-red-400 font-normal">({textLength} / 4000 Zeichen)</p>
                            <p className="text-slate-500 font-normal mt-2">
                                Nutze "Speichern" und einen Cloud-Link stattdessen.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={`flex ${isMultiPart ? 'gap-4' : ''} mb-4`}>
                                <div className="bg-white p-4 rounded-xl border-4 border-slate-100 flex flex-col items-center">
                                    <canvas ref={qrRef} style={{ width: isMultiPart ? '140px' : '100%', maxWidth: isMultiPart ? '140px' : '280px', height: 'auto' }}></canvas>
                                    {isMultiPart && (
                                        <p className="text-xs font-bold text-blue-600 mt-2">① Zuerst</p>
                                    )}
                                </div>
                                {isMultiPart && (
                                    <div className="bg-white p-4 rounded-xl border-4 border-slate-100 flex flex-col items-center">
                                        <canvas ref={qrRef2} style={{ width: '140px', maxWidth: '140px', height: 'auto' }}></canvas>
                                        <p className="text-xs font-bold text-green-600 mt-2">② Dann</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsMaximized(true)}
                                className="absolute bottom-8 right-2 p-3 bg-white/90 shadow-md border rounded-full text-slate-600 hover:text-blue-600 hover:scale-110 transition min-touch-target"
                                title="Vergrößern"
                            >
                                <Icons.Maximize size={20} />
                            </button>
                        </>
                    )}
                </div>

                {!tooLongError && mode !== 'link' && (
                    <p className="text-xs text-slate-400 mt-1 mb-2 text-center">
                        {mode === 'text' ? 'Status + Text' : 'Nur Text'} ({textLength} Zeichen)
                        {errorLevel === 'M' && <span className="text-green-600"> • Erweiterte Fehlererkennung</span>}
                    </p>
                )}

                <p className="text-center text-slate-500 text-sm mb-4">
                    {isMultiPart
                        ? 'Bitte beide Codes nacheinander scannen!'
                        : 'Scanne diesen Code mit der App-Kamera eines anderen Geräts.'
                    }
                </p>

                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-full min-touch-target"
                >
                    Schließen
                </button>
            </div>
        </div>
    );
};
