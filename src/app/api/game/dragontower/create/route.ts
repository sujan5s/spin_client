import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// Configuration
export const DIFFICULTY_CONFIG: Record<string, { cols: number; mines: number; multipliers: number[] }> = {
    "easy": {
        cols: 4,
        mines: 1,
        multipliers: [1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26, 9.69, 12.93] // Approx Stake 4/3 odds
    },
    "medium": {
        cols: 3,
        mines: 1,
        multipliers: [1.45, 2.18, 3.27, 4.91, 7.36, 11.04, 16.56, 24.84, 37.26] // Approx Stake 3/2 odds
    },
    "hard": {
        cols: 2,
        mines: 1,
        multipliers: [1.94, 3.88, 7.76, 15.52, 31.04, 62.08, 124.16, 248.32, 496.64] // Approx Stake 2/1 odds
    },
    "expert": {
        cols: 3,
        mines: 2,
        multipliers: [2.91, 8.73, 26.19, 78.57, 235.71, 707.13, 2121.39, 6364.17, 19092.51] // 3 cols, 2 mines (1 safe) -> 3x
    },
    "master": {
        cols: 4,
        mines: 3,
        multipliers: [3.88, 15.52, 62.08, 248.32, 993.28, 3973.12, 15892.48, 63569.92, 254279.68] // 4 cols, 3 mines (1 safe) -> 4x
    }
};

const ROWS = 9;

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
        const { betAmount, difficulty = "medium" } = body;

        if (!betAmount || betAmount < 10) { // Min bet 10
            return NextResponse.json({ error: "Minimum bet is 10" }, { status: 400 });
        }

        const config = DIFFICULTY_CONFIG[difficulty];
        if (!config) {
            return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
        }

        // Generate Tower
        // Each row has 'cols' tiles. 'mines' of them are mines (0). The rest are safe (1).
        const tower: number[][] = [];
        for (let r = 0; r < ROWS; r++) {
            const row = Array(config.cols).fill(1); // Fill with Safe
            // Place Mines
            let minesPlaced = 0;
            while (minesPlaced < config.mines) {
                const idx = Math.floor(Math.random() * config.cols);
                if (row[idx] === 1) {
                    row[idx] = 0; // Mine
                    minesPlaced++;
                }
            }
            tower.push(row);
        }

        // Transaction
        const transactionResult = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");
            if (user.balance < betAmount) throw new Error("Insufficient funds");

            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: betAmount } }
            });

            const game = await tx.dragonTowerGame.create({
                data: {
                    userId,
                    betAmount,
                    difficulty,
                    status: "active",
                    currentRow: 0,
                    tower: JSON.stringify(tower),
                    multiplier: 1.0
                }
            });

            return { game, balance: user.balance - betAmount };
        });

        return NextResponse.json({
            gameId: transactionResult.game.id,
            balance: transactionResult.balance,
            difficulty,
            config: {
                cols: config.cols,
                rows: ROWS,
                multipliers: config.multipliers
            }
        });

    } catch (error: any) {
        console.error("Dragon Tower Create Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
