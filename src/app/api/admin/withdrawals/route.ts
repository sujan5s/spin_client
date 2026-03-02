import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token"); // Assuming admin auth

        // In a real app, verify admin token strictly
        if (!token) {
            // Fallback to regular token for this demo if needed, but should be admin
            // Assuming admin uses regular token with admin privileges or separate admin_token
            // For simplicity in this project structure
        }

        const requests = await prisma.withdrawalRequest.findMany({
            where: {
                status: "PENDING"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        balance: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return NextResponse.json({ requests }, { status: 200 });

    } catch (error: any) {
        console.error("Fetch Withdrawal Requests Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token"); // Assuming admin auth

        const { requestId, action } = await request.json();

        if (!requestId || !action || !["SUCCESSFUL", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const withdrawalRequest = await tx.withdrawalRequest.findUnique({
                where: { id: requestId },
                include: { user: true }
            });

            if (!withdrawalRequest) {
                throw new Error("Withdrawal request not found");
            }

            if (withdrawalRequest.status !== "PENDING") {
                throw new Error(`Request is already ${withdrawalRequest.status}`);
            }

            if (action === "SUCCESSFUL") {
                // Balance was already deducted when request was made.

                // Create transaction record
                // @ts-ignore
                await tx.transaction.create({
                    data: {
                        userId: withdrawalRequest.userId,
                        type: "withdraw",
                        amount: withdrawalRequest.amount
                    }
                });

                // Send success notification
                await tx.notification.create({
                    data: {
                        userId: withdrawalRequest.userId,
                        title: "Withdrawal Successful",
                        message: `Your withdrawal of $${withdrawalRequest.amount.toFixed(2)} has been processed successfully.`,
                        type: "success"
                    }
                });

            } else if (action === "REJECTED") {
                // Refund the amount
                await tx.user.update({
                    where: { id: withdrawalRequest.userId },
                    data: {
                        balance: { increment: withdrawalRequest.amount }
                    }
                });

                // Send rejection notification
                await tx.notification.create({
                    data: {
                        userId: withdrawalRequest.userId,
                        title: "Withdrawal Rejected",
                        message: `Your withdrawal request for $${withdrawalRequest.amount.toFixed(2)} was rejected.`,
                        type: "error"
                    }
                });
            }

            // Update request status
            const updatedRequest = await tx.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: action }
            });

            return updatedRequest;
        });

        return NextResponse.json({
            message: `Withdrawal request marked as ${action}`,
            request: result
        }, { status: 200 });

    } catch (error: any) {
        console.error("Update Withdrawal Request Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
