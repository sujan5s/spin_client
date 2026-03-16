"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
}

export default function LoadingSpinner({ className, size = 20 }: LoadingSpinnerProps) {
    return (
        <Loader2 
            className={cn("animate-spin text-current", className)} 
            size={size} 
        />
    );
}
