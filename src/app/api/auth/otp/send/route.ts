import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const expressUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, '');

        const beResponse = await fetch(`${expressUrl}/api/auth/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("OTP Proxy error - cause:", error?.cause ?? error);
        return NextResponse.json(
            { error: "Internal server error", detail: String(error?.cause ?? error) },
            { status: 500 }
        );
    }
}
