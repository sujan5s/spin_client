import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// Helper for Combination (nCr)
function factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function combination(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    return factorial(n) / (factorial(r) * factorial(n - r));
}

// Stake's probability formula logic
// Multiplier = nCr(25, mines) / nCr(25-revealed, mines)
async function calculateMultiplier(mines: number, revealedCount: number, prisma: PrismaClient): Promise<number> {

    // 1. Try to fetch custom settings
    // Optimization: In a real app, cache this. For now, fetch is okay or pass it in.
    const config = await prisma.minesConfiguration.findFirst();

    if (config && config.settings) {
        try {
            const settings = JSON.parse(config.settings);
            // Settings structure: { "3": [1.1, 1.5, ...], "5": [...] }
            // "3" is the number of mines. Array is multipliers for 1st safe, 2nd safe, etc.
            // revealedCount is current count (1-indexed for the step we just made? No, revealedCount is total revealed AFTER this move).
            // array index = revealedCount - 1

            const mineSettings = settings[mines.toString()];
            if (mineSettings && Array.isArray(mineSettings)) {
                const index = revealedCount - 1;
                if (index >= 0 && index < mineSettings.length) {
                    return parseFloat(Number(mineSettings[index]).toFixed(2));
                }
            }
        } catch (e) {
            console.error("Error parsing mines config", e);
        }
    }

    // 2. Fallback to Formula
    const totalTiles = 25;
    const remainingTiles = totalTiles - revealedCount; // revealedCount is ALREADY including the one we just revealed?
    // Wait, the logic in original function was:
    // "Multipler for this step = 1 / Chance"
    // But we need the CUMULATIVE multiplier for the current state (revealedCount tiles revealed).

    // Original formula re-implementation:
    const possibleWorlds = combination(totalTiles, mines); // C(25, M)
    const remainingWorlds = combination(totalTiles - revealedCount, mines); // C(25-R, M)

    let rawMultiplier = 0.99 * (possibleWorlds / remainingWorlds);
    if (revealedCount === 0) return 1.0;

    return parseFloat(rawMultiplier.toFixed(2));
}

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
        const { gameId, tileIndex } = body;

        if (!gameId || typeof tileIndex !== 'number' || tileIndex < 0 || tileIndex > 24) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const game = await prisma.minesGame.findUnique({
            where: { id: gameId, userId: userId }
        });

        if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
        if (game.status !== "active") return NextResponse.json({ error: "Game is not active" }, { status: 400 });

        const revealed = JSON.parse(game.revealed) as number[];
        const mines = JSON.parse(game.mines) as number[];

        if (revealed.includes(tileIndex)) {
            return NextResponse.json({ error: "Tile already revealed" }, { status: 400 });
        }

        let updatedGame;
        let outcome = "";

        if (mines.includes(tileIndex)) {
            // EXPLOSION (Loss)
            outcome = "loss";
            updatedGame = await prisma.minesGame.update({
                where: { id: gameId },
                data: {
                    status: "lost",
                    revealed: JSON.stringify([...revealed, tileIndex]),
                    profit: -game.betAmount,
                }
            });

            // Log Transaction (Loss effectively already handled by initial deduction, but we track profit)
            await prisma.transaction.create({
                data: {
                    userId,
                    type: "game_loss",
                    amount: 0 // Already deducted
                }
            });

        } else {
            // SUCCESS (Safe)
            outcome = "safe";
            const newRevealed = [...revealed, tileIndex];
            const newMultiplier = await calculateMultiplier(game.minesCount, newRevealed.length, prisma);
            const currentProfit = (game.betAmount * newMultiplier) - game.betAmount;

            updatedGame = await prisma.minesGame.update({
                where: { id: gameId },
                data: {
                    revealed: JSON.stringify(newRevealed),
                    multiplier: newMultiplier,
                    profit: currentProfit
                }
            });
        }

        // Response
        if (outcome === "loss") {
            // Reveal ALL mines on loss
            return NextResponse.json({
                status: "lost",
                mines: mines, // Show where bombs were
                revealed: JSON.parse(updatedGame.revealed)
            });
        } else {
            return NextResponse.json({
                status: "active",
                multiplier: updatedGame.multiplier,
                currentPayout: (game.betAmount * updatedGame.multiplier),
                revealed: JSON.parse(updatedGame.revealed)
            });
        }

    } catch (error: any) {
        console.error("Mines Reveal Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
