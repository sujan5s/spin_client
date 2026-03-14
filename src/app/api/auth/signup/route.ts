import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { email, name, password, otp, referralCode } = await request.json();

        const expressUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, '');

        const beResponse = await fetch(`${expressUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password, otp, referralCode })
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
                    userAgent: ua,
                },
            });
        } catch (logErr) {
            console.error("Login log write failed:", logErr);
            // non-fatal — don't block the signup
        }

        // Create response with token visible to client for WebSocket auth
        const response = NextResponse.json(
            { user: data.user, token: data.token },
            { status: 201 }
        );

        if (data.token) {
            response.cookies.set("token", data.token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            });
        }

        return response;
    } catch (error: any) {
        const expressUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        console.error("Signup error - target URL:", expressUrl);
        console.error("Signup error - cause:", error?.cause ?? error);
        return NextResponse.json(
            { error: "Internal server error", detail: String(error?.cause ?? error) },
            { status: 500 }
        );
    }
}
