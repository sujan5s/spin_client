import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("token");
    const { pathname } = request.nextUrl;

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            await jwtVerify(token.value, JWT_SECRET);
            return NextResponse.next();
        } catch (error) {
            // Token invalid or expired
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Redirect authenticated users away from auth pages
    // Redirect authenticated users away from auth pages
    if (pathname === "/login" || pathname === "/signup") {
        if (token) {
            try {
                await jwtVerify(token.value, JWT_SECRET);
                return NextResponse.redirect(new URL("/dashboard", request.url));
            } catch (error) {
                // Token invalid, allow access to login/signup
                return NextResponse.next();
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};
