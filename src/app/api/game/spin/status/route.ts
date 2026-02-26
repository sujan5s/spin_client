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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { dailySpinCount: true, lastSpinDate: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch settings
        const settings = await prisma.spinGameSettings.findFirst();
        const maxSpins = settings?.maxSpinsPerDay ?? 3;

        // Check if day has passed (simple check based on date string or Day difference)
        // Better: Check if lastSpinDate is "today"
        const now = new Date();
        const lastSpin = new Date(user.lastSpinDate);

        const isSameDay = now.toDateString() === lastSpin.toDateString();

        let currentCount = isSameDay ? user.dailySpinCount : 0;

        // If it's a new day effectively, we report 0, but we don't update DB here (lazy update on spin)

        // Calculate time until next reset (Midnight tomorrow)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeUntilReset = tomorrow.getTime() - now.getTime();

        return NextResponse.json({
            spinsUsed: currentCount,
            maxSpins: maxSpins,
            // If currentCount >= maxSpins, they are blocked
            remainingSpins: Math.max(0, maxSpins - currentCount),
            timeUntilReset: timeUntilReset
        });

    } catch (error) {
        console.error("Error fetching spin status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
