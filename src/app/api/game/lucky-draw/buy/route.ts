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

        if (![50, 100, 200, 500].includes(amount)) {
            return NextResponse.json(
                { error: "Invalid ticket amount" },
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

            // 3. Create Ticket
            const tokenNumber = `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const ticket = await tx.ticket.create({
                data: {
                    userId,
                    price: amount,
                    tokenNumber,
                    status: "active",
                },
            });

            // 4. Create transaction record
            // @ts-ignore
            await tx.transaction.create({
                data: {
                    userId,
                    type: "ticket_purchase",
                    amount: amount,
                },
            });

            // 5. Create Notification
            // @ts-ignore
            await tx.notification.create({
                data: {
                    userId,
                    title: "Ticket Purchased",
                    message: `You bought a $${amount} Lucky Draw ticket. Good luck!`,
                    type: "success",
                }
            });

            return {
                balance: updatedUser.balance,
                ticket,
                message: "Ticket purchased successfully"
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Ticket purchase error:", error);
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
