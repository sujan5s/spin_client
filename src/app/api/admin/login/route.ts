import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Simple environment-based check
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPass) {
            return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
        }

        if (email !== adminEmail || password !== adminPass) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Create Admin Token
        const token = await new SignJWT({ role: "admin", email: adminEmail })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(JWT_SECRET);

        const cookieStore = await cookies();
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return NextResponse.json({ message: "Admin login successful" });

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
