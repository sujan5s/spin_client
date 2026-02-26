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

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get user and check balance
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            if (user.balance < amount) {
                throw new Error("Insufficient balance");
            }

            // 2. Update balance
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                },
            });

            // 3. Create transaction record
            // @ts-ignore
            await tx.transaction.create({
                data: {
                    userId,
                    type: "withdraw",
                    amount: amount,
                },
            });

            // 4. Create Notification
            // @ts-ignore
            await tx.notification.create({
                data: {
                    userId,
                    title: "Withdrawal Successful",
                    message: `You have successfully withdrawn $${amount.toFixed(2)}.`,
                    type: "success",
                }
            });

            return {
                balance: updatedUser.balance,
                message: "Withdrawal successful"
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Withdraw error:", error);
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
