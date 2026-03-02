import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    // matches existing admin auth pattern

    try {
        const requests = await prisma.accountDeletionRequest.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: {
                        id: true, name: true, email: true,
                        balance: true, createdAt: true, kycStatus: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Admin deletion requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { requestId, action } = await request.json();
        if (!requestId || !["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const req = await prisma.accountDeletionRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });
        if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        if (action === "APPROVED") {
            // Hard delete the user account and all related data in a transaction
            await prisma.$transaction(async (tx) => {
                // Mark request approved first
                await tx.accountDeletionRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } });
                // Delete the user (Cascade deletes related records if Prisma onDelete is set, otherwise clean manually)
                // Clean up dependent records
                await tx.loginLog.deleteMany({ where: { userId: req.userId } });
                await tx.notification.deleteMany({ where: { userId: req.userId } });
                await tx.transaction.deleteMany({ where: { userId: req.userId } });
                await tx.minesGame.deleteMany({ where: { userId: req.userId } });
                await tx.shuffleGame.deleteMany({ where: { userId: req.userId } });
                await tx.dragonTowerGame.deleteMany({ where: { userId: req.userId } });
                await tx.ticket.deleteMany({ where: { userId: req.userId } });
                await tx.withdrawalRequest.deleteMany({ where: { userId: req.userId } });
                await tx.accountDeletionRequest.deleteMany({ where: { userId: req.userId } });
                await tx.user.delete({ where: { id: req.userId } });
            });
            return NextResponse.json({ success: true, message: "Account deleted" });
        } else {
            await prisma.accountDeletionRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
            // Notify user
            await prisma.notification.create({
                data: {
                    userId: req.userId,
                    title: "Account Deletion Request Rejected",
                    message: "Your account deletion request has been reviewed and rejected by our team.",
                    type: "info",
                },
            });
            return NextResponse.json({ success: true, message: "Request rejected" });
        }
    } catch (error: any) {
        console.error("Admin deletion action error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
