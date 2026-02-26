import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenIconProps {
    className?: string;
    size?: number;
}

export function TokenIcon({ className, size = 20 }: TokenIconProps) {
    return (
        <span
            className={cn(
                "relative inline-flex items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-yellow-600/50",
                className
            )}
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
            aria-label="Gaming Token"
        >
            {/* Inner Ring */}
            <span className="absolute inset-[10%] rounded-full border border-yellow-200/40" />

            {/* Gloss */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/40" />

            <Gamepad2
                className="text-amber-900 relative z-10 drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]"
                size={size * 0.55}
                strokeWidth={2.5}
            />
        </span>
    );
}
