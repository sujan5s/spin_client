import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const backendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const expressUrl = backendUrl.replace(/:\d+$/, ':3001');

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

        return NextResponse.json({ user: data.user }, { status: 200 });
    } catch (error: any) {
        console.error("Session check error:", error);
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }
}
