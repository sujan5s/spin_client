"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface GamesEnabled {
    [key: string]: boolean;
}

interface SystemSettingsContextType {
    bonusDeductionPct: number;
    gamesEnabled: GamesEnabled;
    isLoading: boolean;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
    const [bonusDeductionPct, setBonusDeductionPct] = useState<number>(20);
    const [gamesEnabled, setGamesEnabled] = useState<GamesEnabled>({
        spin: true,
        roulette: true,
        slots: true,
        mines: true,
        plinko: true,
        dragontower: true,
        shuffle: true,
        luckydraw: true
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/system-settings");
            if (res.ok) {
                const data = await res.json();
                setBonusDeductionPct(data.bonusDeductionPct);
                if (data.gamesEnabled) {
                    setGamesEnabled(data.gamesEnabled);
                }
            }
        } catch (error) {
            console.error("Failed to load system settings", error);
        } finally {
            if (isLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();

        // Poll every 5 seconds for real-time updates without WebSockets
        const intervalId = setInterval(fetchSettings, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <SystemSettingsContext.Provider value={{ bonusDeductionPct, gamesEnabled, isLoading }}>
            {children}
        </SystemSettingsContext.Provider>
    );
}

export function useSystemSettings() {
    const context = useContext(SystemSettingsContext);
    if (context === undefined) {
        throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
    }
    return context;
}
