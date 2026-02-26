import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, name, password, otp, referralCode } = await request.json();

        const backendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const expressUrl = backendUrl.replace(/:\d+$/, ':3001');

        const beResponse = await fetch(`${expressUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password, otp, referralCode })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
        }

        // Create response with cookie
        const response = NextResponse.json(
            { user: data.user },
            { status: 201 }
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
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
