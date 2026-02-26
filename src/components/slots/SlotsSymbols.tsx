import React from 'react';

// Common Gradients for Glossy 3D Look
const goldGradient = (id: string) => (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="25%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#b45309" />
        <stop offset="75%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fef08a" />
    </linearGradient>
);

export const Symbol7 = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 5px 5px rgba(0,0,0,0.4))">
        <defs>{goldGradient("gold7Rad")}</defs>
        <path d="M20,20 L80,20 L55,90 L35,90 L60,35 L20,35 Z" fill="url(#gold7Rad)" stroke="#92400e" strokeWidth="1" />
        <path d="M22,22 L78,22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M63,35 L40,88" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
);

export const SymbolDiamond = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 0 15px rgba(59,130,246,0.6))">
        <defs>
            <linearGradient id="diamRad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
        </defs>
        <path d="M15,40 L35,15 L65,15 L85,40 L50,95 Z" fill="url(#diamRad)" stroke="#60a5fa" strokeWidth="1" />
        {/* Facets */}
        <path d="M15,40 L35,15" stroke="white" strokeWidth="0.5" opacity="0.5" />
        <path d="M85,40 L65,15" stroke="white" strokeWidth="0.5" opacity="0.5" />
        <path d="M35,15 L65,15" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <path d="M15,40 L50,55 L85,40" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M50,95 L50,55" stroke="white" strokeWidth="0.5" opacity="0.3" />
        {/* Shine */}
        <circle cx="25" cy="40" r="3" fill="white" filter="blur(1px)" />
    </svg>
);

export const SymbolBell = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 4px 5px rgba(0,0,0,0.3))">
        <defs>{goldGradient("bellRad")}</defs>
        <path d="M50,10 Q85,10 90,75 L10,75 Q15,10 50,10 Z" fill="url(#bellRad)" stroke="#b45309" strokeWidth="1" />
        <ellipse cx="50" cy="75" rx="40" ry="8" fill="#b45309" opacity="0.3" />
        <circle cx="50" cy="75" r="8" fill="#92400e" />
        <path d="M35,20 Q45,20 45,60" stroke="white" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />
    </svg>
);

export const SymbolCherry = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 4px 4px rgba(0,0,0,0.3))">
        <defs>
            <radialGradient id="cherryRadRed" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#ffb3b3" />
                <stop offset="20%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
        </defs>

        {/* Stems */}
        <path d="M35,55 Q50,10 65,55" fill="none" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
        <path d="M50,25 L65,20" fill="none" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
        <path d="M65,20 Q75,10 70,30 Q55,35 65,20 Z" fill="#4d7c0f" />

        {/* Fruits */}
        <circle cx="30" cy="65" r="16" fill="url(#cherryRadRed)" stroke="#7f1d1d" strokeWidth="0.5" />
        <circle cx="70" cy="65" r="16" fill="url(#cherryRadRed)" stroke="#7f1d1d" strokeWidth="0.5" />

        {/* Glossy Reflection */}
        <ellipse cx="22" cy="58" rx="5" ry="3" fill="white" opacity="0.7" transform="rotate(-45 22 58)" />
        <ellipse cx="62" cy="58" rx="5" ry="3" fill="white" opacity="0.7" transform="rotate(-45 62 58)" />
    </svg>
);

export const SymbolLemon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 4px 2px rgba(0,0,0,0.3))">
        <defs>
            <radialGradient id="lemonRad" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="38" ry="28" fill="url(#lemonRad)" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="12" cy="50" r="3" fill="#ca8a04" />
        <circle cx="88" cy="50" r="3" fill="#ca8a04" />
        <path d="M30,35 Q50,25 70,35" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M50,22 Q60,10 70,22" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />
    </svg>
);

export const SymbolWatermelon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 4px 2px rgba(0,0,0,0.3))">
        <path d="M10,55 A40,35 0 0,0 90,55 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        <path d="M10,55 A40,35 0 0,0 90,55" fill="none" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
        {/* Seeds */}
        <ellipse cx="35" cy="65" rx="2" ry="4" fill="black" />
        <ellipse cx="50" cy="75" rx="2" ry="4" fill="black" />
        <ellipse cx="65" cy="65" rx="2" ry="4" fill="black" />
        {/* Gloss */}
        <path d="M20,60 A30,25 0 0,0 80,60" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
    </svg>
);

export const getSymbolComponent = (symbol: string) => {
    switch (symbol) {
        case '7': return Symbol7;
        case 'diamond': return SymbolDiamond;
        case 'bell': return SymbolBell;
        case 'cherry': return SymbolCherry;
        case 'lemon': return SymbolLemon;
        case 'watermelon': return SymbolWatermelon;
        default: return SymbolLemon;
    }
};
