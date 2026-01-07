import React from 'react';

export const ProgressBar = ({ progress }) => {
    return (
        <div className="px-6 py-2 bg-white border-b border-slate-200">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};
