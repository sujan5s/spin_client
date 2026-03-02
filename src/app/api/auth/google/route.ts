import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { token: inputToken, referralCode } = await request.json();

        const expressUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, '');

        const beResponse = await fetch(`${expressUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inputToken, referralCode })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
        }

        // Record login log
        try {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
                ?? request.headers.get("x-real-ip")
                ?? "unknown";
            const ua = request.headers.get("user-agent") ?? "unknown";
            await prisma.loginLog.create({
                data: {
                    userId: data.user.id,
                    email: data.user.email,
                    ipAddress: ip,
                    userAgent: `[Google] ${ua}`,
                },
            });
        } catch (logErr) {
            console.error("Login log write failed (google):", logErr);
            // non-fatal
        }

        // Create response with cookie
        const response = NextResponse.json(
            { user: data.user },
            { status: 200 }
        );

        if (data.token) {
            response.cookies.set("token", data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            });
        }

        return response;
    } catch (error: any) {
        console.error("Google Auth Error Details:", error);
        return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
    }
}
