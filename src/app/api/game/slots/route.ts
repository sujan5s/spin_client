import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// High-Roller Gold Symbols
const SYMBOLS = ['clover', 'cherry', 'bell', 'diamond', '7'] as const;
type SymbolType = typeof SYMBOLS[number];

// Weighted Probabilities
const WEIGHTS: Record<SymbolType, number> = {
    'clover': 50,
    'cherry': 40,
    'bell': 30,
    'diamond': 15,
    '7': 5
};

// Paytable
const PAYTABLE: Record<SymbolType, { 3: number, 4: number, 5: number }> = {
    'clover': { 3: 2, 4: 5, 5: 10 },
    'cherry': { 3: 3, 4: 8, 5: 15 },
    'bell': { 3: 5, 4: 15, 5: 30 },
    'diamond': { 3: 10, 4: 30, 5: 60 },
    '7': { 3: 50, 4: 200, 5: 1000 } // Jackpot
};

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const body = await request.json();
        const { betAmount } = body;

        if (!betAmount || betAmount <= 0) {
            return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
        }

        // Fetch Configuration
        let weights = WEIGHTS;
        let paytable = PAYTABLE;

        const config = await prisma.slotsConfiguration.findFirst();
        if (config) {
            try {
                const settings = JSON.parse(config.settings);
                if (settings.weights) weights = settings.weights;
                if (settings.paytable) paytable = settings.paytable;
            } catch (e) {
                console.error("Failed to parse slots config", e);
            }
        }

        // RNG
        const reels: SymbolType[] = [];
        // Calculate total weight dynamically
        const totalWeight = Object.values(weights).reduce((a: any, b: any) => parseInt(a) + parseInt(b), 0) as number;

        for (let i = 0; i < 5; i++) {
            let random = Math.random() * totalWeight;
            let selected: SymbolType = 'clover'; // Default fallback

            for (const sym of SYMBOLS) {
                // Careful with type casting if weights keys don't perfectly match
                const weight = weights[sym as SymbolType] || 0;
                random -= weight;
                if (random < 0) {
                    selected = sym as SymbolType;
                    break;
                }
            }
            reels.push(selected);
        }

        // Win Logic
        const firstSymbol = reels[0];
        let matchCount = 1;
        for (let i = 1; i < 5; i++) {
            if (reels[i] === firstSymbol) {
                matchCount++;
            } else {
                break;
            }
        }

        let multiplier = 0;
        let winType: 'none' | 'small' | 'big' | 'jackpot' = 'none';

        if (matchCount >= 3) {
            if (matchCount >= 3) {
                // @ts-ignore - Dynamic key access
                multiplier = paytable[firstSymbol][matchCount] || 0;
            }
        }

        const winAmount = betAmount * multiplier;
        const profit = winAmount - betAmount;

        if (matchCount === 3) winType = 'small';
        if (matchCount === 4) winType = 'big';
        if (matchCount === 5) winType = 'jackpot';

        // DB Transaction
        const transactionResult = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            if (user.balance < betAmount) throw new Error("Insufficient funds");

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: profit } }
            });

            await tx.transaction.create({
                data: {
                    userId,
                    amount: profit,
                    type: profit > 0 ? "game_win" : "game_loss"
                }
            });

            return updatedUser.balance;
        });

        return NextResponse.json({
            reels,
            winAmount,
            multiplier,
            balance: transactionResult,
            matchCount,
            winType,
            winningSymbol: matchCount >= 3 ? firstSymbol : null
        });

    } catch (error: any) {
        console.error("Slots Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
