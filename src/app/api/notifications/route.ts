import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(request: Request) {
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

        // Fetch top 10 notifications
        // @ts-ignore
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Cleanup old notifications (keep top 10)
        // @ts-ignore
        const totalCount = await prisma.notification.count({ where: { userId } });
        if (totalCount > 10) {
            // Find the ID of the 10th notification
            const tenthNotification = notifications[notifications.length - 1];
            if (tenthNotification) {
                // @ts-ignore
                await prisma.notification.deleteMany({
                    where: {
                        userId,
                        createdAt: { lt: tenthNotification.createdAt }
                    }
                });
            }
        }

        return NextResponse.json(notifications, { status: 200 });

    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
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

        const { title, message, type } = await request.json();

        // @ts-ignore
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'info'
            }
        });

        return NextResponse.json(notification, { status: 200 });
    } catch (error) {
        console.error("Create notification error:", error);
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }
}
