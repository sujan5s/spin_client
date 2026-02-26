import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WinLossPopupProps {
    isOpen: boolean;
    amount: number;
    multiplier: number;
    type: "win" | "loss";
}

export default function WinLossPopup({ isOpen, amount, multiplier, type }: WinLossPopupProps) {
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        setVisible(isOpen);
    }, [isOpen]);

    if (!visible) return null;

    return (
        <div className={cn(
            "absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none",
            "animate-in zoom-in-95 fade-in duration-300"
        )}>
            <div className={cn(
                "px-8 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center min-w-[200px]",
                type === "win"
                    ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]"
                    : "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]"
            )}>
                <span className="text-4xl font-black tracking-tighter drop-shadow-md">
                    {multiplier}x
                </span>
                <span className={cn(
                    "text-lg font-bold uppercase tracking-widest mt-1",
                    type === "win" ? "text-green-200" : "text-red-200"
                )}>
                    {type === "win" ? "Win" : "Loss"}
                </span>
                <span className="text-sm font-mono font-medium opacity-80 mt-1">
                    ${amount.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
