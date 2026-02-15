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

    const displayTitle = (title && title.trim().length > 0) ? title : "Titel";

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
            <style>
                {`
                @media print {
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                    }
                    .qr-print-wrapper {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .qr-print-page {
                        width: 100%;
                        /* min-height removed to let content dictate size, preventing forced overflow */
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        padding: 2cm;
                        box-sizing: border-box;
                    }
                }
                `}
            </style>
            {qrValues.map((val, idx) => (
                <QRItem
                    key={idx}
                    value={val}
                    errorLevel={errorLevel}
                    index={idx + 1}
                    total={qrValues.length}
                    title={qrValues.length > 1 ? `${displayTitle} (${idx + 1}/${qrValues.length})` : displayTitle}
                    isLast={idx === qrValues.length - 1}
                />
            ))}
        </div>
    );
};

const QRItem = ({ value, errorLevel, index, total, title, isLast }) => {
    const canvasRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    useEffect(() => {
        // Render QR code to an offscreen canvas, then convert to img for reliable printing
        const canvas = document.createElement('canvas');
        new QRious({
            element: canvas,
            value: value,
            size: 2000,
            level: errorLevel,
            padding: 0
        });
        setImgSrc(canvas.toDataURL('image/png'));
    }, [value, errorLevel]);

    return (
        <div className="qr-print-page" style={{ pageBreakAfter: isLast ? 'auto' : 'always' }}>
            <h1 className="text-4xl font-black text-slate-900 leading-tight text-center mb-8 w-full break-words">
                {title}
            </h1>

            <div className="w-full flex justify-center">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={`QR Code ${index}`}
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxWidth: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'contain'
                        }}
                    />
                ) : (
                    <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
                )}
            </div>

            {total > 1 && (
                <div className="text-xl font-bold text-slate-800 mt-6 text-center">
                    Teil {index} von {total}
                </div>
            )}
        </div>
    );
};
