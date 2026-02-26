import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const backendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const expressUrl = backendUrl.replace(/:\d+$/, ':3001');

        const beResponse = await fetch(`${expressUrl}/api/auth/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await beResponse.json();

        if (!beResponse.ok) {
            return NextResponse.json(data, { status: beResponse.status });
        }

        return NextResponse.json({ message: "OTP sent successfully" });
    } catch (error: any) {
        console.error("OTP Send Error Details:", error);
        return NextResponse.json({ error: "Failed to send OTP", details: String(error) }, { status: 500 });
    }
}
