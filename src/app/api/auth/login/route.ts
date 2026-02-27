import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const expressUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const beResponse = await fetch(`${expressUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
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
        const expressUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        console.error("Login error - target URL:", expressUrl);
        console.error("Login error - cause:", error?.cause ?? error);
        return NextResponse.json(
            { error: "Internal server error", detail: String(error?.cause ?? error) },
            { status: 500 }
        );
    }
}
