/**
 * Shared UI utility components used across puzzle exercises.
 * Extracted to reduce code duplication.
 */
import React from 'react';

/**
 * Horizontal lines indicator used in stage/word count controls.
 * @param {Object} props
 * @param {number} props.count - Number of lines to display
 */
export const HorizontalLines = ({ count }) => (
    <div className="flex flex-col gap-[2px] w-2 items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[2px] w-full bg-slate-300 rounded-full" />
        ))}
    </div>
);
