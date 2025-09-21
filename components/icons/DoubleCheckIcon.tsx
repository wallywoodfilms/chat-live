import React from 'react';

interface DoubleCheckIconProps extends React.SVGProps<SVGSVGElement> {
    colorClass?: string;
}

export const DoubleCheckIcon: React.FC<DoubleCheckIconProps> = ({ colorClass = 'text-wa-text-secondary', ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={colorClass}
        {...props}
    >
        <path d="M18 6L7 17l-5-5"></path>
        <path d="M22 6l-11 11-3-3"></path>
    </svg>
);
