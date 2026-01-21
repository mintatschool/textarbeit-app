/**
 * Custom hook to prevent touch scrolling during drag operations.
 * Essential for iPad/tablet compatibility.
 * 
 * @param {boolean} isDragging - Whether a drag operation is in progress
 */
import { useEffect } from 'react';

export const usePreventTouchScroll = (isDragging) => {
    useEffect(() => {
        if (!isDragging) return;

        const preventDefault = (e) => {
            e.preventDefault();
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventDefault, { passive: false });

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('touchmove', preventDefault);
        };
    }, [isDragging]);
};

export default usePreventTouchScroll;
