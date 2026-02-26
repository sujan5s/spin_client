import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

// Roulette Constraints
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Helper to determine winnings
function calculateWinnings(result: number, bets: any) {
    let totalWinnings = 0;
    const isRed = RED_NUMBERS.includes(result);
    const isBlack = BLACK_NUMBERS.includes(result);
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 !== 0;
    const isLow = result >= 1 && result <= 18;
    const isHigh = result >= 19 && result <= 36;

    // Column logic
    // Col 1: 1, 4, 7... (val % 3 === 1)
    // Col 2: 2, 5, 8... (val % 3 === 2)
    // Col 3: 3, 6, 9... (val % 3 === 0)
    const col1 = result !== 0 && result % 3 === 1;
    const col2 = result !== 0 && result % 3 === 2;
    const col3 = result !== 0 && result % 3 === 0;

    // Dozen logic
    const doz1 = result >= 1 && result <= 12;
    const doz2 = result >= 13 && result <= 24;
    const doz3 = result >= 25 && result <= 36;

    for (const [betType, amount] of Object.entries(bets)) {
        const betAmount = Number(amount);
        if (isNaN(betAmount) || betAmount <= 0) continue;

        // Straight Up (Specific Number)
        if (!isNaN(Number(betType))) {
            if (Number(betType) === result) {
                totalWinnings += betAmount * 36; // 35:1 + original bet
            }
        }

        // Outside Bets
        else if (betType === "red" && isRed) totalWinnings += betAmount * 2;
        else if (betType === "black" && isBlack) totalWinnings += betAmount * 2;
        else if (betType === "even" && isEven) totalWinnings += betAmount * 2;
        else if (betType === "odd" && isOdd) totalWinnings += betAmount * 2;
        else if (betType === "low" && isLow) totalWinnings += betAmount * 2;
        else if (betType === "high" && isHigh) totalWinnings += betAmount * 2;

        // Dozens (2 to 1) -> Payout is 3x (2 win + 1 bet)
        else if (betType === "1st12" && doz1) totalWinnings += betAmount * 3;
        else if (betType === "2nd12" && doz2) totalWinnings += betAmount * 3;
        else if (betType === "3rd12" && doz3) totalWinnings += betAmount * 3;

        // Columns (2 to 1)
        else if (betType === "col1" && col1) totalWinnings += betAmount * 3;
        else if (betType === "col2" && col2) totalWinnings += betAmount * 3;
        else if (betType === "col3" && col3) totalWinnings += betAmount * 3;
    }

    return totalWinnings;
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
        const { bets } = body;
        // bets structure: { "red": 10, "17": 5, "2nd12": 20 }

        if (!bets || Object.keys(bets).length === 0) {
            return NextResponse.json({ error: "No bets placed" }, { status: 400 });
        }

        // Calculate total bet amount
        let totalBetAmount = 0;
        for (const amount of Object.values(bets)) {
            totalBetAmount += Number(amount);
        }

        if (totalBetAmount <= 0) {
            return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
        }

        // Transaction handling
        const resultData = await prisma.$transaction(async (tx) => {
            // 1. Get User & Lock Balance (Optimistic checks usually, but here we just read)
            const user = await tx.user.findUnique({
                where: { id: userId }
            });

            if (!user) throw new Error("User not found");
            if (user.balance < totalBetAmount) throw new Error("Insufficient funds");

            // 2. Generate Result (0-36)
            // Secure random number generation is better, but Math.random is sufficient for this demo context
            const result = Math.floor(Math.random() * 37);

            // 3. Calculate Win
            const totalWinnings = calculateWinnings(result, bets);
            const netChange = totalWinnings - totalBetAmount;

            // 4. Update Balance
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: netChange } }
            });

            // 5. Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId: userId,
                    amount: netChange,
                    type: netChange > 0 ? "game_win" : "game_loss", // Use existing types
                }
            });

            // Notification will be triggered by client for better timing control

            return {
                result,
                totalWinnings,
                newBalance: updatedUser.balance,
                netChange
            };
        });

        return NextResponse.json({
            success: true,
            result: resultData.result,
            winAmount: resultData.totalWinnings,
            balance: resultData.newBalance,
            netChange: resultData.netChange
        });

    } catch (error: any) {
        console.error("Roulette error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
