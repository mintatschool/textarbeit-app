import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';

export const MenuItem = ({ onClick, children, icon, className = "" }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-sm flex items-center transition min-touch-target ${className}`}
    >
        {icon && <span className="w-8 flex justify-start shrink-0">{icon}</span>}
        <span className="flex-1">{children}</span>
    </button>
);

export const MenuDropdown = ({ title, icon, children, labelVisible = true, align = 'right', className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = dropdownRef.current ? dropdownRef.current.offsetHeight : 300;

            const style = {
                position: 'fixed',
                minWidth: '220px',
                maxHeight: 'min(600px, 90vh)', // Increased max-height slightly
                overflowY: 'auto',
                zIndex: 9999
            };

            const spaceAbove = rect.top;
            const spaceBelow = viewportHeight - rect.bottom;

            // Decision Logic:
            // 1. Prefer opening DOWN if it fits.
            // 2. Else if UP fits, open UP.
            // 3. Else pick the side with MORE space.

            let openUp = false;

            // Check fit
            const fitsDown = spaceBelow >= dropdownHeight;
            const fitsUp = spaceAbove >= dropdownHeight;

            if (fitsDown) {
                openUp = false;
            } else if (fitsUp) {
                openUp = true;
            } else {
                // Doesn't fit either way? Pick largest.
                openUp = spaceAbove > spaceBelow;
            }

            if (openUp) {
                style.bottom = (viewportHeight - rect.top) + 10;
                // Safety: if top goes off screen, clamp it?
                // CSS 'bottom' grows up. If height is huge, top might be negative.
                // We can set max-height to spaceAbove - margin
                style.maxHeight = `min(600px, ${Math.max(100, spaceAbove - 20)}px)`;
            } else {
                style.top = rect.bottom + 10;
                // Safety: max-height limit to spaceBelow
                style.maxHeight = `min(600px, ${Math.max(100, spaceBelow - 20)}px)`;
            }

            if (align === 'right') {
                style.right = window.innerWidth - rect.right;
                style.left = 'auto';
                if (window.innerWidth < 250) { style.left = 10; style.right = 'auto'; }
            } else {
                style.left = rect.left;
            }

            setDropdownStyle(style);
        }
    };

    // Auto-scroll logic when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            // Wait for render to measure dropdown
            requestAnimationFrame(() => {
                if (!dropdownRef.current || !buttonRef.current) return;

                const dropdownHeight = dropdownRef.current.offsetHeight;
                const rect = buttonRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                const spaceAbove = rect.top;
                const spaceBelow = viewportHeight - rect.bottom;

                // If it fits nowhere fully, can we scroll to make it fit?
                // Only scroll if we can achieve FULL visibility by scrolling.
                // And if the dropdown isn't taller than the entire viewport.
                if (dropdownHeight < viewportHeight - 40) {
                    const fitsCurrently = (spaceBelow >= dropdownHeight) || (spaceAbove >= dropdownHeight);

                    if (!fitsCurrently) {
                        // Needs scrolling.
                        // Find scrollable parent.
                        // Start with nearest scrollable ancestor.
                        let parent = buttonRef.current.parentElement;
                        while (parent) {
                            const overflowY = window.getComputedStyle(parent).overflowY;
                            if (overflowY === 'auto' || overflowY === 'scroll') {
                                break;
                            }
                            parent = parent.parentElement;
                        }

                        if (parent) {
                            // Calculate desired position.
                            // To maximize space, we should move the button towards the edge.
                            // If button is in upper half -> scroll to Top (to Open DOWN).
                            // If button is in lower half -> scroll to Bottom (to Open UP).

                            const targetTop = 20; // Margin from top
                            const targetBottom = viewportHeight - 60; // Margin from bottom

                            let targetScrollY;

                            if (rect.top < viewportHeight / 2) {
                                // Move to Top
                                // Current visual Y is rect.top. We want it to be targetTop.
                                // Difference = rect.top - targetTop.
                                // We need to ADD this difference to scrollTop to move the VIEW down?
                                // Wrapper ScrollTop + (rect.top - targetTop) -> Element moves UP visually.
                                targetScrollY = parent.scrollTop + (rect.top - targetTop);
                            } else {
                                // Move to Bottom
                                // Current visual Y is rect.top. We want it to be targetBottom.
                                // visual Y = rect.top. Target = targetBottom.
                                // Diff = rect.top - targetBottom. (Likely negative, meaning we are above target).
                                // Wait, if rect.top is 600, target is 700. Diff = -100.
                                // scrolling by -100 (reducing scrollTop) moves element DOWN. Correct.
                                targetScrollY = parent.scrollTop + (rect.top - targetBottom);
                            }

                            parent.scrollTo({
                                top: targetScrollY,
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && buttonRef.current.contains(event.target)) return;
            if (event.target.closest('.menu-dropdown-portal')) return;
            setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const content = (
        <div
            ref={dropdownRef}
            className="menu-dropdown-portal bg-white rounded-xl shadow-2xl border border-slate-100 p-1 flex flex-col animate-fadeIn fixed z-[9999]"
            style={dropdownStyle}
        >
            <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">{title}</h3>
            {React.Children.map(children, child => {
                return React.cloneElement(child, {
                    onClick: (e) => {
                        if (child.props.onClick) child.props.onClick(e);
                        setIsOpen(false);
                    }
                });
            })}
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-xl transition flex items-center gap-2 min-touch-target ${isOpen ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'} ${className}`}
                title={title}
            >
                {icon}
                {labelVisible && <span className="font-bold text-sm hidden md:inline">{title}</span>}
                {labelVisible && <Icons.ChevronDown size={16} />}
            </button >
            {isOpen && createPortal(content, document.body)
            }
        </>
    );
};
