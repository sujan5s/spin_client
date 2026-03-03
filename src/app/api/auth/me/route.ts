import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        const expressUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, '');

        const beResponse = await fetch(`${expressUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
        }

        // Update active session log asynchronously (only once per hour to limit spam?)
        // The user specifically requested "if his session is active that also should be considred as login log"
        try {
            const ip = request.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim()
                ?? request.headers?.get?.("x-real-ip")
                ?? "active-session";
            const ua = request.headers?.get?.("user-agent") ?? "restored-session";

            // To prevent massive spam on every page load, we only log if the last log is > 1 hour old, 
            // OR we just log it since admin wants it. Let's just log it to be safe for what he explicitly asked.
            await prisma.loginLog.create({
                data: {
                    userId: data.user.id,
                    email: data.user.email,
                    ipAddress: ip,
                    userAgent: `Active Session / ${ua}`,
                },
            });
        } catch (logErr) {
            console.error("Login log active session write failed:", logErr);
            // non-fatal
        }

        return NextResponse.json({ user: data.user }, { status: 200 });
    } catch (error: any) {
        console.error("Session check error:", error);
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
}
