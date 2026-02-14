import { useState, useRef, useCallback, useEffect } from 'react';

// Reusable hook for pointer-event based drag-and-drop
// Replaces HTML5 Drag & Drop to support iPad touch interaction (no shrink, rounded corners, no delay)
// Supports hold-to-drag: short hold to distinguish drag intent from scroll intent
export const usePointerDrag = ({
    onDrop, // (dragItem, targetId, { x, y, targetIndex }) => void
    onDragStart, // (item, sourceId) => void
    onDragEnd, // () => void
    dropZoneSelector = null, // Optional CSS selector to auto-detect drop zones if not using refs
    holdDuration = 200, // ms to hold before drag starts (0 = instant, like on handle)
    moveThreshold = 8, // px of movement that cancels the hold (indicates scroll intent)
    handleSelector = '.drag-handle', // CSS selector for instant-drag handles
}) => {
    const [dragState, setDragState] = useState(null); // { item, sourceId, pos: {x,y}, offset: {x,y}, cloneRect: {width,height}, ... }
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [holdActive, setHoldActive] = useState(false); // Visual feedback: hold timer completed
    const dropZonesRef = useRef({}); // { id: HTMLElement }
    const dragItemRef = useRef(null); // Stable reference for callbacks
    const isDraggingRef = useRef(false);
    const holdTimerRef = useRef(null);
    const pendingDragRef = useRef(null); // Store pending drag info during hold phase

    // Prevent page scroll during drag (iPad vital fix)
    useEffect(() => {
        if (!dragState) return;
        const prevent = (e) => e.preventDefault();
        document.addEventListener('touchmove', prevent, { passive: false });
        return () => document.removeEventListener('touchmove', prevent);
    }, [dragState]);

    // Cleanup hold timer on unmount
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        };
    }, []);

    // Global Window Listeners
    useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (e) => {
            e.preventDefault();
            if (!isDraggingRef.current) return;

            setDragState(prev => prev ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : null);

            // Hit-test drop zones for hover state
            let found = null;
            for (const [id, el] of Object.entries(dropZonesRef.current)) {
                if (!el) continue;
                const r = el.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                    found = id;
                    break;
                }
            }
            setHoveredZoneId(found);
        };

        const handlePointerUp = (e) => {
            if (!isDraggingRef.current) return;

            // Hit-test drop zones
            let dropped = false;
            // Iterate registered drop zones
            for (const [id, el] of Object.entries(dropZonesRef.current)) {
                if (!el) continue;
                const r = el.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                    // Success!
                    if (onDrop && dragItemRef.current) {
                        onDrop(dragItemRef.current.item, id, {
                            x: e.clientX,
                            y: e.clientY,
                            targetIndex: calculateIndexInList(e.clientY, el) // Helper for lists?
                        });
                        dropped = true;
                    }
                    break;
                }
            }

            endDrag();
        };

        const handlePointerCancel = () => {
            endDrag();
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };
    }, [dragState, onDrop]);

    // --- Hold-phase listeners: track movement during hold to cancel if scrolling ---
    useEffect(() => {
        if (!pendingDragRef.current) return;

        const pending = pendingDragRef.current;

        const handleMoveWhileHolding = (e) => {
            if (!pendingDragRef.current) return;
            const dx = e.clientX - pending.startPos.x;
            const dy = e.clientY - pending.startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > moveThreshold) {
                // User is scrolling, cancel the hold
                cancelHold();
            }
        };

        const handleUpWhileHolding = () => {
            // User lifted finger before hold completed = tap, not drag
            cancelHold();
        };

        window.addEventListener('pointermove', handleMoveWhileHolding);
        window.addEventListener('pointerup', handleUpWhileHolding);
        window.addEventListener('pointercancel', handleUpWhileHolding);

        return () => {
            window.removeEventListener('pointermove', handleMoveWhileHolding);
            window.removeEventListener('pointerup', handleUpWhileHolding);
            window.removeEventListener('pointercancel', handleUpWhileHolding);
        };
    }, [holdActive, moveThreshold]); // Re-bind when holdActive changes (pending state toggle)

    const cancelHold = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        pendingDragRef.current = null;
        setHoldActive(false);
    }, []);

    const startDrag = useCallback((e, item, sourceId) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();

        const state = {
            item,
            sourceId,
            pos: { x: e.clientX, y: e.clientY },
            offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            cloneRect: { width: rect.width, height: rect.height },
            cloneStyle: window.getComputedStyle(target) // Capture style? Or pass visual?
        };

        setDragState(state);
        dragItemRef.current = { item, sourceId };
        isDraggingRef.current = true;
        setHoldActive(false);
        pendingDragRef.current = null;

        if (onDragStart) onDragStart(item, sourceId);
    }, [onDragStart]);

    const startDragFromPending = useCallback((pending) => {
        const state = {
            item: pending.item,
            sourceId: pending.sourceId,
            pos: { ...pending.startPos },
            offset: { ...pending.offset },
            cloneRect: { ...pending.cloneRect },
            cloneStyle: pending.cloneStyle
        };

        setDragState(state);
        dragItemRef.current = { item: pending.item, sourceId: pending.sourceId };
        isDraggingRef.current = true;
        setHoldActive(false);
        pendingDragRef.current = null;

        if (onDragStart) onDragStart(pending.item, pending.sourceId);
    }, [onDragStart]);

    const endDrag = useCallback(() => {
        setDragState(null);
        setHoveredZoneId(null);
        setHoldActive(false);
        dragItemRef.current = null;
        isDraggingRef.current = false;
        pendingDragRef.current = null;
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (onDragEnd) onDragEnd();
    }, [onDragEnd]);

    // Helper for consumers
    const registerDropZone = useCallback((id) => (el) => {
        if (el) dropZonesRef.current[id] = el;
        else delete dropZonesRef.current[id];
    }, []);

    const getDragProps = useCallback((item, sourceId) => ({
        onPointerDown: (e) => {
            if (e.button !== 0) return; // Only left click
            if (e.target.closest('button') || e.target.closest('input')) return;

            // Check if the touch is on the drag handle
            const isOnHandle = e.target.closest(handleSelector);
            const isMouse = e.pointerType === 'mouse';

            if (isOnHandle || holdDuration === 0 || isMouse) {
                // Immediate drag (handle, mouse, or no delay configured)
                startDrag(e, item, sourceId);
            } else {
                // Hold-to-drag: start timer
                const target = e.currentTarget;
                const rect = target.getBoundingClientRect();

                const pending = {
                    item,
                    sourceId,
                    startPos: { x: e.clientX, y: e.clientY },
                    offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                    cloneRect: { width: rect.width, height: rect.height },
                    cloneStyle: window.getComputedStyle(target)
                };

                pendingDragRef.current = pending;
                setHoldActive(true); // Triggers the hold-phase listeners

                holdTimerRef.current = setTimeout(() => {
                    // Hold completed! Start drag.
                    if (pendingDragRef.current) {
                        startDragFromPending(pendingDragRef.current);
                    }
                    holdTimerRef.current = null;
                }, holdDuration);
            }
        },
        onTouchStart: (e) => {
            // Block global mobile-drag-drop polyfill only on handle
            const isOnHandle = e.target.closest(handleSelector);
            if (isOnHandle && !e.target.closest('button') && !e.target.closest('input')) {
                e.stopPropagation();
            }
        },
        // Only set touch-action: none on the handle via CSS, not the whole element
        // This allows native scrolling on the body of the item
        'data-has-drag': 'true',
    }), [startDrag, startDragFromPending, holdDuration, handleSelector]);

    // Basic heuristic to find index in a vertical list
    // Returns index where item should be inserted (0 to N)
    const calculateIndexInList = (y, containerEl) => {
        // Assume children are the items. 
        const children = Array.from(containerEl.children);
        // Filter out non-item elements (like placeholders) if possible?
        // Simple approach: find first child whose center > y
        let index = 0;
        for (const child of children) {
            const r = child.getBoundingClientRect();
            const center = r.top + r.height / 2;
            if (y < center) {
                return index;
            }
            index++;
        }
        return index;
    };

    return {
        dragState,
        hoveredZoneId,
        isDragging: !!dragState,
        holdActive, // True during the hold phase (before drag starts) - use for visual feedback
        registerDropZone,
        getDragProps,
        cancelDrag: endDrag
    };
};
