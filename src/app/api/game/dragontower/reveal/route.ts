import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// Duplicated config for now - ideal to share but importing from another route file can be flaky in NextJS API structure without a util
const DIFFICULTY_CONFIG: Record<string, { cols: number; mines: number; multipliers: number[] }> = {
    "easy": {
        cols: 4,
        mines: 1,
        multipliers: [1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26, 9.69, 12.93]
    },
    "medium": {
        cols: 3,
        mines: 1,
        multipliers: [1.45, 2.18, 3.27, 4.91, 7.36, 11.04, 16.56, 24.84, 37.26]
    },
    "hard": {
        cols: 2,
        mines: 1,
        multipliers: [1.94, 3.88, 7.76, 15.52, 31.04, 62.08, 124.16, 248.32, 496.64]
    },
    "expert": {
        cols: 3,
        mines: 2,
        multipliers: [2.91, 8.73, 26.19, 78.57, 235.71, 707.13, 2121.39, 6364.17, 19092.51]
    },
    "master": {
        cols: 4,
        mines: 3,
        multipliers: [3.88, 15.52, 62.08, 248.32, 993.28, 3973.12, 15892.48, 63569.92, 254279.68]
    }
};
const ROWS = 9;

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const body = await request.json();
        const { gameId, tileIndex } = body;

        const game = await prisma.dragonTowerGame.findUnique({ where: { id: gameId } });
        if (!game || game.userId !== userId || game.status !== "active") {
            return NextResponse.json({ error: "Invalid game" }, { status: 400 });
        }

        const tower = JSON.parse(game.tower); // 2D Array
        const currentRow = game.currentRow;

        if (currentRow >= ROWS) {
            return NextResponse.json({ error: "Game already finished" }, { status: 400 });
        }

        // Check Tile
        const row = tower[currentRow];
        const isSafe = row[tileIndex] === 1;
        const config = DIFFICULTY_CONFIG[game.difficulty];

        if (isSafe) {
            const nextRow = currentRow + 1;
            const newMultiplier = config.multipliers[currentRow];

            // Check if won (reached top)
            if (nextRow >= ROWS) {
                // Auto Cashout
                const winAmount = game.betAmount * newMultiplier;

                await prisma.$transaction([
                    prisma.dragonTowerGame.update({
                        where: { id: gameId },
                        data: {
                            status: "won",
                            currentRow: nextRow,
                            multiplier: newMultiplier
                        }
                    }),
                    prisma.user.update({
                        where: { id: userId },
                        data: { balance: { increment: winAmount } }
                    }),
                    prisma.transaction.create({
                        data: {
                            userId,
                            amount: winAmount,
                            type: "game_win"
                        }
                    })
                ]);

                return NextResponse.json({
                    status: "won",
                    rowContent: row, // Reveal full row
                    multiplier: newMultiplier,
                    winAmount
                });
            } else {
                // Continue
                await prisma.dragonTowerGame.update({
                    where: { id: gameId },
                    data: {
                        currentRow: nextRow,
                        multiplier: newMultiplier
                    }
                });

                return NextResponse.json({
                    status: "continue",
                    rowContent: row,
                    multiplier: newMultiplier
                });
            }
        } else {
            // Mine Hit
            await prisma.dragonTowerGame.update({
                where: { id: gameId },
                data: { status: "lost" }
            });

            return NextResponse.json({
                status: "lost",
                rowContent: row, // Reveal row (shows where mines were)
                allRows: tower // Reveal EVERYTHING so user sees path
            });
        }

    } catch (error: any) {
        return NextResponse.json({ error: "Error revealing tile" }, { status: 500 });
    }
}
