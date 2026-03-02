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

        const { amount, paymentMethod, upiId, accountNumber, ifscCode } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        if (!paymentMethod || !["UPI", "BANK"].includes(paymentMethod)) {
            return NextResponse.json(
                { error: "Invalid payment method" },
                { status: 400 }
            );
        }

        if (paymentMethod === "UPI" && !upiId) {
            return NextResponse.json(
                { error: "UPI ID is required" },
                { status: 400 }
            );
        }

        if (paymentMethod === "BANK" && (!accountNumber || !ifscCode)) {
            return NextResponse.json(
                { error: "Account number and IFSC code are required" },
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

            // 2. Deduct balance immediately
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                }
            });

            // 3. Create Withdrawal Request
            const withdrawalRequest = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: amount,
                    status: "PENDING",
                    paymentMethod,
                    upiId: paymentMethod === "UPI" ? upiId : null,
                    accountNumber: paymentMethod === "BANK" ? accountNumber : null,
                    ifscCode: paymentMethod === "BANK" ? ifscCode : null,
                }
            });

            // 4. Create Notification
            await tx.notification.create({
                data: {
                    userId,
                    title: "Withdrawal Requested",
                    message: `Your withdrawal request for $${amount.toFixed(2)} is pending approval.`,
                    type: "info",
                }
            });

            return {
                balance: updatedUser.balance,
                message: "Withdrawal request submitted successfully",
                request: withdrawalRequest
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Withdraw error:", error);
        if (error.message.includes("Insufficient") || error.message.includes("User not found")) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
