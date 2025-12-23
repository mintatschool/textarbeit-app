import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';

export const MenuItem = ({ onClick, children, icon }) => (
    <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-sm flex items-center transition min-touch-target"
    >
        {icon && <span className="w-8 flex justify-start shrink-0">{icon}</span>}
        <span className="flex-1">{children}</span>
    </button>
);

export const MenuDropdown = ({ title, icon, children, labelVisible = true, align = 'top' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();

            const style = {
                position: 'fixed',
                minWidth: '220px',
                maxHeight: 'min(500px, 80vh)',
                overflowY: 'auto',
                zIndex: 9999
            };

            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;

            // Wenn mehr Platz oben ist -> nach oben öffnen
            if (spaceAbove > spaceBelow) {
                style.bottom = (window.innerHeight - rect.top) + 10;
                // Verhindern dass es oben aus dem Bild rutscht
                const estimatedHeight = 300; // Sicherheitswert
                if (rect.top < estimatedHeight) {
                    style.bottom = 'auto';
                    style.top = 10;
                }
            } else {
                // Sonst nach unten öffnen
                style.top = rect.bottom + 10;
            }

            if (align === 'right') {
                // Rechtsbündig zum Button (für die vertikale Toolbar rechts)
                style.right = window.innerWidth - rect.right;
                style.left = 'auto';

                // Fallback für sehr schmale Screens
                if (window.innerWidth < 250) { style.left = 10; style.right = 'auto'; }
            } else {
                style.left = rect.left;
            }

            setDropdownStyle(style);
        }
    };

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
        <div className="menu-dropdown-portal bg-white rounded-xl shadow-2xl border border-slate-100 p-1 flex flex-col animate-fadeIn fixed z-[9999]" style={dropdownStyle}>
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
                className={`p-3 rounded-full transition flex items-center gap-2 min-touch-target ${isOpen ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'}`}
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
