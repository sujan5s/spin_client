import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SEGMENTS } from "@/lib/game-config";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Verify JWT
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const { betAmount } = await request.json();

        if (!betAmount || betAmount < 10) {
            return NextResponse.json(
                { error: "Minimum bet amount is 10" },
                { status: 400 }
            );
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            // CHECK DAILY LIMIT
            const settings = await tx.spinGameSettings.findFirst();
            const maxSpins = settings?.maxSpinsPerDay ?? 3;

            const now = new Date();
            const lastSpin = new Date(user.lastSpinDate);
            const isSameDay = now.toDateString() === lastSpin.toDateString();

            let currentCount = isSameDay ? user.dailySpinCount : 0;

            if (currentCount >= maxSpins) {
                throw new Error("Daily spin limit reached");
            }

            if (user.balance < betAmount) {
                throw new Error("Insufficient balance");
            }

            // 2. Determine outcome using Weighted Random Logic from Database

            // @ts-ignore
            let segments = await tx.spinSegment.findMany({
                where: { isVisible: true },
                orderBy: { id: 'asc' }
            });

            // Fallback to config if no segments in DB (safety check)
            if (segments.length === 0) {
                // Potentially seed here if transaction limits allow, or just throw error/use static
                // For now, let's assume if it's empty we use static but mapped to same structure
                // Fallback to config if no segments in DB (safety check)
                // @ts-ignore
                segments = SEGMENTS.map((s, idx) => ({ ...s, probability: 10, id: idx, isVisible: true }));
            }

            // Calculate Total Weight
            const totalWeight = segments.reduce((sum: number, segment: any) => sum + segment.probability, 0);

            // Random value between 0 and totalWeight
            let random = Math.random() * totalWeight;

            let selectedSegment = segments[0];
            let segmentIndex = 0;

            for (let i = 0; i < segments.length; i++) {
                random -= segments[i].probability;
                if (random <= 0) {
                    selectedSegment = segments[i];
                    segmentIndex = i;
                    break;
                }
            }

            const multiplier = selectedSegment.value;
            const winAmount = betAmount * multiplier;
            const profit = winAmount - betAmount; // Net change

            // 3. Update balance
            // Deduct bet, add winnings (or just add profit)
            // balance = balance - bet + win
            const newBalance = user.balance - betAmount + winAmount;

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    balance: newBalance,
                    dailySpinCount: currentCount + 1, // Increment count (reset handled by logic above, but here we just set based on calculated current)
                    lastSpinDate: now
                },
            });

            // 4. Create transaction record
            // We can record the bet and win separately or as one "game" transaction
            // Let's record it as one "game_spin" transaction with the net amount
            // Or better: record the "bet" (negative) and "win" (positive) if won?
            // To keep it simple and consistent with the user request "spin amount update",
            // let's record the net result.
            // If winAmount > 0, it's a win. If 0, it's a loss.

            // @ts-ignore
            await tx.transaction.create({
                data: {
                    userId,
                    type: winAmount > 0 ? "game_win" : "game_loss",
                    amount: profit, // This will be negative if lost, positive if won
                },
            });

            // Notification will be triggered by client for better timing control

            // GENERATE REELS VISUALS
            const SYMBOLS = ['cherry', 'lemon', 'watermelon', 'diamond', '7', 'bell'];
            let resultReels: string[] = [];

            if (winAmount > 0) {
                // Determine symbol based on multiplier or just pick a "good" one
                // High multiplier -> 'diamond' or '7'
                // Low multiplier -> 'cherry' or 'lemon'
                let winningSymbol = 'cherry';
                if (multiplier >= 10) winningSymbol = 'diamond';
                else if (multiplier >= 5) winningSymbol = '7';
                else if (multiplier >= 2) winningSymbol = 'bell';
                else winningSymbol = 'lemon';

                resultReels = Array(5).fill(winningSymbol);
            } else {
                // Generate random reels ensuring no win (simple approach: just random)
                // To be safe we should check, but for a simple game just random is usually enough to not trigger 5-in-a-row by accident often
                for (let i = 0; i < 5; i++) {
                    const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                    resultReels.push(randomSymbol);
                }

                // Safety check: Avoid accidental 5-of-a-kind on loss
                const allSame = resultReels.every(r => r === resultReels[0]);
                if (allSame) {
                    // Force change one
                    resultReels[0] = resultReels[0] === 'diamond' ? 'cherry' : 'diamond';
                }
            }

            return {
                balance: updatedUser.balance,
                segmentIndex,
                multiplier,
                winAmount,
                reels: resultReels,
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Spin error:", error);
        if (error.message === "Insufficient balance") {
            return NextResponse.json(
                { error: "Insufficient balance" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
