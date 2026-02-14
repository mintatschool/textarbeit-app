import React, { useEffect, useRef, useMemo, useState } from 'react';
import QRious from 'qrious';

export const QRCodePrintView = ({ text, settings, title }) => {
    // UTF-8 Encoding Fix based on QRCodeModal.jsx
    const toUtf8Bytes = (str) => {
        try {
            return unescape(encodeURIComponent(str));
        } catch (e) {
            return str;
        }
    };

    const parsedData = useMemo(() => {
        try {
            return JSON.parse(text);
        } catch (e) {
            return { text: text };
        }
    }, [text]);

    const { qrValues, errorLevel } = useMemo(() => {
        if (!parsedData || !parsedData.text) {
            return { qrValues: [], errorLevel: 'M' };
        }

        const contentToEncode = text;
        const finalContent = toUtf8Bytes(contentToEncode);
        const MAX_CHUNK_SIZE = 900;

        if (finalContent.length > MAX_CHUNK_SIZE) {
            const totalParts = Math.ceil(finalContent.length / MAX_CHUNK_SIZE);
            const transferId = Date.now().toString(36).slice(-4) + Math.random().toString(36).substr(2, 4);
            const balancedChunkSize = Math.ceil(finalContent.length / totalParts);

            const parts = [];
            for (let i = 0; i < totalParts; i++) {
                const start = i * balancedChunkSize;
                const end = Math.min(start + balancedChunkSize, finalContent.length);
                const chunkData = finalContent.substring(start, end);
                parts.push(`qrp|${transferId}|${i + 1}|${totalParts}|${chunkData}`);
            }

            return { qrValues: parts, errorLevel: 'L' };
        }

        return {
            qrValues: [finalContent],
            errorLevel: finalContent.length < 500 ? 'M' : 'L'
        };
    }, [text, parsedData]);

    return (
        <div className="print-content hidden qr-print-wrapper">
            {qrValues.map((val, idx) => (
                <QRItem
                    key={idx}
                    value={val}
                    errorLevel={errorLevel}
                    index={idx + 1}
                    total={qrValues.length}
                    title={title ? (qrValues.length > 1 ? `${title} (${idx + 1}/${qrValues.length})` : title) : (qrValues.length > 1 ? `QR-Code (${idx + 1}/${qrValues.length})` : '')}
                />
            ))}
            <style>
                {`
                @media screen {
                    .print-content {
                        display: none !important;
                    }
                }
                @media print {
                    .qr-print-wrapper {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    .qr-print-page {
                        page-break-after: always;
                        page-break-inside: avoid;
                        width: 100%;
                        height: 100vh;
                        position: relative;
                        overflow: hidden;
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    .qr-print-page:last-child {
                        page-break-after: avoid;
                    }
                }
                `}
            </style>
        </div>
    );
};

const QRItem = ({ value, errorLevel, index, total, title }) => {
    const canvasRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    useEffect(() => {
        // Render QR code to an offscreen canvas, then convert to img for reliable printing
        const canvas = document.createElement('canvas');
        new QRious({
            element: canvas,
            value: value,
            size: 600,
            level: errorLevel,
            padding: 20
        });
        setImgSrc(canvas.toDataURL('image/png'));
    }, [value, errorLevel]);

    return (
        <div className="qr-print-page">
            {/* Title at fixed top position */}
            {(title && title.trim().length > 0) && (
                <div style={{ position: 'absolute', top: '8%', left: '0', width: '100%', textAlign: 'center', padding: '0 2rem' }}>
                    <h1 className="text-4xl font-black text-slate-900 leading-tight">
                        {title}
                    </h1>
                </div>
            )}

            {/* QR Code exactly centered - use img for reliable print rendering */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                {imgSrc ? (
                    <img src={imgSrc} alt={`QR Code ${index}`} style={{ width: '500px', height: '500px' }} />
                ) : (
                    <canvas ref={canvasRef} style={{ width: '500px', height: '500px' }} />
                )}
            </div>

            {/* Part Info at fixed bottom position */}
            {total > 1 && (
                <div style={{ position: 'absolute', bottom: '8%', left: '0', width: '100%', textAlign: 'center' }}>
                    <div className="text-xl font-bold text-slate-800">
                        Teil {index} von {total}
                    </div>
                </div>
            )}
        </div>
    );
};
