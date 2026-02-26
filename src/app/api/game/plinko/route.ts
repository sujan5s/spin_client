import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PLINKO_MULTIPLIERS } from "@/lib/plinko-config";

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
        const { betAmount, rows = 16, risk = 'medium' } = body;

        if (!betAmount || betAmount <= 0) {
            return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
        }

        const validRows = [8, 12, 16];
        if (!validRows.includes(rows)) {
            return NextResponse.json({ error: "Invalid row count" }, { status: 400 });
        }

        const validRisk = ['low', 'medium', 'high'];
        if (!validRisk.includes(risk)) {
            return NextResponse.json({ error: "Invalid risk level" }, { status: 400 });
        }

        // Fetch Configuration
        const config = await prisma.plinkoConfiguration.findUnique({
            where: {
                rows_risk: { rows, risk }
            }
        });

        let multiplier: number;
        let resultIndex: number;

        if (config) {
            const settings = JSON.parse(config.settings);

            // Weighted Random Selection
            const totalWeight = settings.reduce((sum: number, item: any) => sum + item.probability, 0);
            let random = Math.random() * totalWeight;

            let selectedItem = settings[0];
            for (const item of settings) {
                random -= item.probability;
                if (random < 0) {
                    selectedItem = item;
                    break;
                }
            }

            resultIndex = selectedItem.index;
            multiplier = selectedItem.multiplier;
        } else {
            // Fallback to default if no config exists (shouldn't happen if setup correctly)
            // @ts-ignore
            const multipliers = PLINKO_MULTIPLIERS[rows][risk];
            // Simple random fallback
            resultIndex = Math.floor(Math.random() * multipliers.length);
            // Or standard normal distribution approximation logic could go here, but for now simple fallback

            // Better fallback: Simulate standard drop (50/50)
            const tempPath: number[] = [];
            for (let i = 0; i < rows; i++) tempPath.push(Math.random() > 0.5 ? 1 : 0);
            resultIndex = tempPath.reduce((a, b) => a + b, 0);
            multiplier = multipliers[resultIndex];
        }

        // Generate Path to reach resultIndex
        // We need exactly 'resultIndex' number of "Right" moves (1s)
        const path: number[] = Array(rows).fill(0);
        for (let i = 0; i < resultIndex; i++) {
            path[i] = 1;
        }

        // Shuffle path
        // Fisher-Yates shuffle
        for (let i = path.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [path[i], path[j]] = [path[j], path[i]];
        }

        const winAmount = betAmount * multiplier;
        const profit = winAmount - betAmount;

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

            // Optional: Notification? Maybe too spammy for Plinko if auto-betting.
            // Let's create it only for big wins (> 10x)?
            // Actually user logic was spammy for spin, keeping consistency for now.
            /*
            await tx.notification.create({
                data: {
                    userId,
                    title: profit > 0 ? "Plinko Win" : "Plinko Result",
                    message: `Multiplier: ${multiplier}x. Profit: ${profit}`,
                    type: profit > 0 ? "success" : "info"
                }
            });
            */

            return updatedUser.balance;
        });

        return NextResponse.json({
            path,
            resultIndex,
            multiplier,
            winAmount,
            balance: transactionResult
        });

    } catch (error: any) {
        console.error("Plinko Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
