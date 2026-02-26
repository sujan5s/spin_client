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

        const game = await prisma.dragonTowerGame.findUnique({ where: { id: gameId } });
        if (!game || game.userId !== userId || game.status !== "active") {
            return NextResponse.json({ error: "Invalid game" }, { status: 400 });
        }

        if (game.currentRow === 0) {
            return NextResponse.json({ error: "Cannot cashout at start" }, { status: 400 });
        }

        const winAmount = game.betAmount * game.multiplier;

        const transactionResult = await prisma.$transaction(async (tx) => {
            // Update Game
            await tx.dragonTowerGame.update({
                where: { id: gameId },
                data: { status: "cashed_out" }
            });

            // Update User
            const u = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: winAmount } }
            });

            // Transaction
            await tx.transaction.create({
                data: {
                    userId,
                    amount: winAmount,
                    type: "game_win"
                }
            });

            return u.balance;
        });

        return NextResponse.json({
            status: "cashed_out",
            winAmount,
            balance: transactionResult
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Error cashing out" }, { status: 500 });
    }
}
