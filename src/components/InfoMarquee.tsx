"use client";

import { useEffect, useState } from "react";

export function InfoMarquee() {
    const [text, setText] = useState("");
    const [speed, setSpeed] = useState(25);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/system-settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.marqueeText) {
                        setText(data.marqueeText);
                    }
                    if (data.marqueeSpeed) {
                        setSpeed(data.marqueeSpeed);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch marquee text:", error);
            }
        };

        fetchSettings();
    }, []);

    if (!text) return null;

    return (
        <div className="w-full bg-blue-600/20 border-b border-blue-500/30 overflow-hidden py-2 px-4 shadow-sm relative z-40">
            <div className="flex whitespace-nowrap overflow-hidden items-center group">
                <div
                    className="animate-marquee inline-flex gap-8 group-hover:[animation-play-state:paused] text-blue-200 text-sm font-medium tracking-wide"
                    style={{ animationDuration: `${speed}s` }}
                >
                    {/* Render text multiple times to ensure seamless infinite scroll */}
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                </div>
                <div
                    className="absolute top-0 animate-marquee2 inline-flex gap-8 group-hover:[animation-play-state:paused] text-blue-200 text-sm font-medium tracking-wide"
                    style={{ animationDuration: `${speed}s` }}
                >
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                    <span className="shrink-0">{text}</span>
                </div>
            </div>
        </div>
    );
}
