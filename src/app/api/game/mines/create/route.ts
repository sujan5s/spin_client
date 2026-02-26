import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

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
        const { betAmount, minesCount } = body;

        // Validation
        if (!betAmount || betAmount < 10) return NextResponse.json({ error: "Minimum bet amount is 10" }, { status: 400 });
        if (!minesCount || minesCount < 1 || minesCount > 24) return NextResponse.json({ error: "Invalid mines count (1-24)" }, { status: 400 });

        // Helper to generate unique mines
        const generateMines = (count: number) => {
            const positions = Array.from({ length: 25 }, (_, i) => i);
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }
            return positions.slice(0, count);
        };

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            if (user.balance < betAmount) throw new Error("Insufficient funds");

            // Deduct balance
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: betAmount } }
            });

            // Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId,
                    amount: -betAmount,
                    type: "game_bet_mines" // Updated type for clarity
                }
            });

            // Create Game Session
            const mines = generateMines(minesCount);
            const game = await tx.minesGame.create({
                data: {
                    userId,
                    betAmount,
                    minesCount,
                    mines: JSON.stringify(mines),
                    revealed: JSON.stringify([]),
                    status: "active",
                    multiplier: 1.0,
                    profit: 0
                }
            });

            return { game, balance: user.balance - betAmount };
        });

        // Hide mines in response
        const { mines, ...safeGame } = result.game;

        return NextResponse.json({
            game: safeGame,
            balance: result.balance
        });

    } catch (error: any) {
        console.error("Mines Create Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
