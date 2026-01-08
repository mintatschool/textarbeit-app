import React, { useRef, useState, useMemo, useEffect } from 'react';
import QRious from 'qrious';
import { Icons } from './Icons';

export const QRCodeModal = ({ text, onClose }) => {
    const qrRef = useRef(null);
    const fullQrRef = useRef(null);
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

    // Daten-Aufbereitung & Platz-Optimierung
    const qrValue = useMemo(() => {
        if (!parsedData || !parsedData.text) return "";

        let contentToEncode = text; // Default: The input string

        if (mode === 'raw') {
            // Extract ONLY the text content from the JSON
            if (parsedData && parsedData.text) {
                contentToEncode = parsedData.text;
            } else {
                // If it's already just text or doesn't have structure
                contentToEncode = text;
            }
        } else {
            // Standard Full Mode (Text logic below)
        }

        // Feature: Markierungen als # exportieren
        if (showHashes && parsedData.highlights && Array.isArray(parsedData.highlights) && parsedData.highlights.length > 0) {
            const rawText = parsedData.text;
            const highlights = new Set(parsedData.highlights);

            // Reconstruct text with #
            // Logic must match App.jsx word detection approximate
            const segments = rawText.split(/(\s+)/);
            let currentIndex = 0;
            let stringWithHashes = "";

            segments.forEach(segment => {
                // Check if segment is a word (same regex as App.jsx)
                const match = segment.match(/^([^\w\u00C0-\u017F]*)([\w\u00C0-\u017F]+(?:\-[\w\u00C0-\u017F]+)*)([^\w\u00C0-\u017F]*)$/);

                if (match) {
                    const prefix = match[1];
                    const cleanWord = match[2];
                    const suffix = match[3];
                    const wordStartIndex = currentIndex + prefix.length;

                    // Check if word is highlighted (any char?) - Usually checked by specific indices
                    // We check if the FIRST character of the word is highlighted
                    // (Assuming word-based highlighting)
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

            // If we export with #, we usually just want the Text String, not the JSON state?
            // "Generiert die Lehrkraft einen QR-Code aus einem vormarkierten Text..."
            // "Dann wird vor jedes markierte Wort ein #-Zeichen gesetzt."
            // Assuming this implies passing just the TEXT (compatible with other apps or simple import).
            contentToEncode = stringWithHashes;
        }

        if (contentToEncode.length > 2900) {
            setTooLongError(true);
            return "";
        }
        setTooLongError(false);

        // Wrap simple text if it's not the full JSON and not too long?
        // If we generated the hash-string, it's just a string.
        // If it sends 'contentToEncode' which IS the JSON string, it's fine.

        // Logic from before:
        // const rawString = text.length > 300 ? text : JSON.stringify({ text: text });

        // If we have hashes, we send raw string.
        if (showHashes) return toUtf8Bytes(contentToEncode);

        // Standard behavior
        // Standard behavior
        if (mode === 'raw') {
            return toUtf8Bytes(contentToEncode);
        }

        const rawString = contentToEncode.length > 300 ? contentToEncode : (contentToEncode.startsWith('{') ? contentToEncode : JSON.stringify({ text: contentToEncode }));
        return toUtf8Bytes(rawString);

    }, [text, parsedData, showHashes]);

    // QR-Code für Text rendern
    useEffect(() => {
        if (mode === 'link') return;
        if (qrRef.current && qrValue && !isMaximized && !tooLongError) {
            try {
                new QRious({
                    element: qrRef.current,
                    value: qrValue,
                    size: 1000, // High resolution for dense data
                    level: 'L' // Low error correction = mehr Platz für Daten
                });
            } catch (e) {
                console.error("QR Generierung fehlgeschlagen:", e);
                setTooLongError(true);
            }
        }
    }, [qrValue, isMaximized, tooLongError, mode]);

    // QR-Code für maximierte Ansicht
    useEffect(() => {
        if (fullQrRef.current && qrValue && isMaximized && !tooLongError) {
            try {
                const size = Math.min(window.innerWidth, window.innerHeight) * 0.85;
                // Render at higher resolution internally, scale via CSS
                new QRious({
                    element: fullQrRef.current,
                    value: mode === 'link' ? linkInput : qrValue,
                    size: Math.max(size * 2, 1200), // Force high res (at least 1200 or 2x screen)
                    level: 'L'
                });
            } catch (e) {
                console.error("QR Maximierung fehlgeschlagen:", e);
            }
        }
    }, [qrValue, isMaximized, tooLongError, linkInput, mode]);

    // QR-Code für Link-Eingabe generieren
    const generateLinkQR = () => {
        if (!linkInput || !qrRef.current) return;
        setMode('link');
        try {
            new QRious({
                element: qrRef.current,
                value: linkInput,
                size: 280,
                level: 'M' // Medium für Links reicht aus
            });
        } catch (e) {
            console.error("Link QR fehlgeschlagen:", e);
        }
    };

    // Zurück zu Text-QR
    const resetToText = () => {
        setMode('text');
        setLinkInput("");
    };

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            {/* Maximierte Vollbild-Ansicht */}
            {isMaximized && !tooLongError && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white p-4 border-8 border-slate-100 rounded-2xl shadow-2xl max-w-[95vw] max-h-[85vh] flex justify-center items-center">
                        <canvas ref={fullQrRef} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}></canvas>
                    </div>
                    <p className="mt-4 text-slate-500 font-medium">
                        {mode === 'link' ? 'Link-QR-Code' : (mode === 'raw' ? 'Nur Text (Kompakt)' : 'Kompletter Status')}
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
            <div className="bg-white rounded-2xl shadow-2xl p-6 modal-animate flex flex-col items-center max-w-sm w-full max-h-[90vh] overflow-y-auto custom-scroll">
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

                {/* QR-Code Anzeige */}
                <div className="relative group w-full flex justify-center">
                    {tooLongError ? (
                        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center text-sm font-bold min-h-[280px] flex flex-col items-center justify-center gap-2">
                            <Icons.AlertTriangle size={48} className="text-red-400" />
                            <p>Der Text ist zu lang für einen QR-Code.</p>
                            <p className="text-red-400 font-normal">({text?.length || 0} / 2900 Zeichen)</p>
                            <p className="text-slate-500 font-normal mt-2">
                                Nutze "Speichern" und einen Cloud-Link stattdessen.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-xl border-4 border-slate-100 mb-4 flex justify-center min-h-[280px] flex-col items-center">
                                <canvas ref={qrRef} style={{ width: '100%', maxWidth: '280px', height: 'auto' }}></canvas>
                                {mode !== 'link' && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        {mode === 'text' ? 'Status + Text' : 'Nur Text'} ({parsedData?.text?.length || text?.length || 0} Zeichen)
                                    </p>
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

                <p className="text-center text-slate-500 text-sm mb-4">
                    Scanne diesen Code mit der App-Kamera eines anderen Geräts.
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
