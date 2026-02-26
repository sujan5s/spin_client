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

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const body = await request.json();
        const { gameId } = body;

        if (!gameId) return NextResponse.json({ error: "Game ID required" }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const game = await tx.minesGame.findUnique({
                where: { id: gameId, userId: userId }
            });

            if (!game) throw new Error("Game not found");
            if (game.status !== "active") throw new Error("Game not active");

            // Calculate Final Payout
            const payout = game.betAmount * game.multiplier;
            const profit = payout - game.betAmount;

            // Update Game Status
            const updatedGame = await tx.minesGame.update({
                where: { id: gameId },
                data: {
                    status: "cashed_out",
                    profit: profit
                }
            });

            // Credit User
            const user = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: payout } }
            });

            // Log Transaction
            await tx.transaction.create({
                data: {
                    userId,
                    amount: payout,
                    type: "game_win"
                }
            });

            // Reveal Mines (Optional: Stake reveals mines after cashout to prove fairness)
            return { updatedGame, balance: user.balance, mines: game.mines };
        });

        return NextResponse.json({
            status: "cashed_out",
            payout: result.updatedGame.betAmount * result.updatedGame.multiplier,
            balance: result.balance,
            mines: JSON.parse(result.mines) // Show mines to prove user was safe or not
        });

    } catch (error: any) {
        console.error("Mines Cashout Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
