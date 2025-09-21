import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    options: { label: string; action: () => void }[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute z-50 w-48 bg-wa-dark-lighter rounded-md shadow-lg border border-gray-700 py-1"
            style={{ top: y, left: x }}
        >
            <ul>
                {options.map((option, index) => (
                    <li key={index}>
                        <button
                            onClick={() => {
                                option.action();
                                onClose();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-wa-text hover:bg-wa-dark-light/50"
                        >
                            {option.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ContextMenu;