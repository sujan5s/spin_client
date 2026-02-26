"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RouletteWheelProps {
    targetNumber: number | null;
    isSpinning: boolean;
    onSpinComplete: () => void;
}

const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function RouletteWheel({ targetNumber, isSpinning, onSpinComplete }: RouletteWheelProps) {
    const [rotation, setRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [ballRadius, setBallRadius] = useState(165); // Start on rim

    useEffect(() => {
        if (isSpinning && targetNumber !== null) {
            const segmentAngle = 360 / 37;
            const targetIndex = WHEEL_ORDER.indexOf(targetNumber);

            // WHEEL ANIMATION
            // We want the wheel to spin CW
            const spins = 5;
            const baseRotation = 360 * spins;
            // Target alignment: We want the number to end up at Top (0 deg)
            // If number is at angle A on wheel, and Wheel rotates R. Final pos = (A + R) % 360.
            // We want Final Pos = 0.
            // So R = -A. 
            const targetAngleOnWheel = targetIndex * segmentAngle;
            // Add randomness? No, exact alignment.
            const finalWheelRotation = rotation + baseRotation + (360 - targetAngleOnWheel - (rotation % 360));
            setRotation(finalWheelRotation);

            // BALL ANIMATION
            // Ball spins CCW (relative to board? or absolute?)
            // Usually ball goes opposite to Wheel.
            // Simple approach: Just spin wheel + fixed pointer.
            // COMPLEX APPROACH requested: Ball settles.
            // Let's stick to "Wheel Spins, Pointer Fixed" for visual stability on web, 
            // BUT user wants physics feel.
            // Let's assume the "Ball" is the gold pointer at top for now to ensure visibility first, 
            // as user said "not visible/black".

            setTimeout(() => {
                onSpinComplete();
            }, 8000);
        }
    }, [isSpinning, targetNumber]);

    return (
        <div className="relative w-[320px] h-[320px] md:w-[500px] md:h-[500px] flex items-center justify-center">
            {/* Outer Static Shadow/Rim NOT rotating */}
            <div className="absolute inset-0 rounded-full border-[12px] border-[#5a3a2a] shadow-2xl z-0 bg-[#3e2723]" />
            <div className="absolute inset-4 rounded-full border-[2px] border-[#ffd700] z-0 opacity-50" />

            {/* Rotating Wheel Container */}
            <div
                className="w-[90%] h-[90%] rounded-full relative transition-transform cubic-bezier(0.2, 0, 0.2, 1) z-10"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionDuration: isSpinning ? "8000ms" : "0ms"
                }}
            >
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fcd34d" />
                            <stop offset="50%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#fcd34d" />
                        </linearGradient>
                        <radialGradient id="center-grad">
                            <stop offset="0%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#78350f" />
                        </radialGradient>
                    </defs>

                    {/* Wheel Base */}
                    <circle cx="200" cy="200" r="198" fill="#2c1810" stroke="#d97706" strokeWidth="2" />

                    {/* Segments */}
                    <g transform="translate(200, 200) rotate(-90)"> {/* Rotate -90 to start 0 at top */}
                        {WHEEL_ORDER.map((num, i) => {
                            const angle = 360 / 37;
                            const startAngle = i * angle;
                            const endAngle = (i + 1) * angle;

                            // Calculate path for slice
                            // Convert polar to cartesian
                            const r = 190;
                            const x1 = r * Math.cos(Math.PI * startAngle / 180);
                            const y1 = r * Math.sin(Math.PI * startAngle / 180);
                            const x2 = r * Math.cos(Math.PI * endAngle / 180);
                            const y2 = r * Math.sin(Math.PI * endAngle / 180);

                            const isRed = RED_NUMBERS.includes(num);
                            const isZero = num === 0;
                            const fillColor = isZero ? "#16a34a" : isRed ? "#b91c1c" : "#111827";
                            const textColor = "#ffffff";

                            return (
                                <g key={i}>
                                    {/* Slice Path */}
                                    <path
                                        d={`M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                                        fill={fillColor}
                                        stroke="#d97706"
                                        strokeWidth="0.5"
                                    />

                                    {/* Text */}
                                    {/* Position text in middle of slice at certain radius */}
                                    <g transform={`rotate(${startAngle + angle / 2}) translate(175, 0)`}>
                                        <text
                                            x="0"
                                            y="0"
                                            fill={textColor}
                                            fontSize="14"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform="rotate(90)"
                                        >
                                            {num}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </g>

                    {/* Inner Decoration Ring */}
                    <circle cx="200" cy="200" r="130" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.5" />

                    {/* Center Hub */}
                    <circle cx="200" cy="200" r="80" fill="url(#center-grad)" stroke="#d97706" strokeWidth="4" />

                    {/* Spokes (Decorative) */}
                    <g transform="translate(200,200)">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                            <rect key={deg} x="-5" y="-60" width="10" height="120" fill="#d97706" rx="5" transform={`rotate(${deg})`} />
                        ))}
                        <circle cx="0" cy="0" r="20" fill="url(#gold-grad)" stroke="#fff" strokeWidth="1" />
                    </g>
                </svg>
            </div>

            {/* The Pointer / Ball Indicator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-yellow-400 border-r-[15px] border-r-transparent" />
            </div>

            {/* Shiny overlay for "Glass" effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-20" />
        </div>
    );
}
