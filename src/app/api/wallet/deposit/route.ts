import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

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

        const { amount } = await request.json();

        console.log("Deposit request received for user:", userId, "Amount:", amount);

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Update user balance and create transaction
        const result = await prisma.$transaction(async (tx) => {
            // Check for previous deposits to determine if this is the first one
            const depositCount = await tx.transaction.count({
                where: {
                    userId: userId,
                    type: "deposit"
                }
            });

            // Update user balance for the deposit
            let user = await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: amount },
                },
                include: { referredBy: true } // Include referrer info
            });

            // Create deposit transaction
            await tx.transaction.create({
                data: {
                    userId,
                    type: "deposit",
                    amount,
                },
            });

            // Referral Logic: First Deposit Only
            if (depositCount === 0) {
                // 1. Reward Referee (The new user)
                const REFEREE_BONUS = 50;
                user = await tx.user.update({
                    where: { id: userId },
                    data: { balance: { increment: REFEREE_BONUS } },
                    include: { referredBy: true }
                });

                await tx.transaction.create({
                    data: {
                        userId,
                        type: "welcome_bonus",
                        amount: REFEREE_BONUS
                    }
                });
                console.log(`Welcome bonus of ${REFEREE_BONUS} awarded to user ${userId}`);

                // 2. Reward Referrer
                if (user.referredById) {
                    const REFERRER_BONUS = 100;
                    await tx.user.update({
                        where: { id: user.referredById },
                        data: { balance: { increment: REFERRER_BONUS } }
                    });

                    await tx.transaction.create({
                        data: {
                            userId: user.referredById,
                            type: "referral_bonus",
                            amount: REFERRER_BONUS
                        }
                    });
                    console.log(`Referral bonus of ${REFERRER_BONUS} awarded to referrer ${user.referredById}`);
                }
            }

            console.log("Transaction created and balances updated");

            return user;
        });

        return NextResponse.json({ balance: result.balance }, { status: 200 });
    } catch (error) {
        console.error("Deposit error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
