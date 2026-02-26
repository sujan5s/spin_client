import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { nanoid } from 'nanoid'

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referrals: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate referral code if not exists
        if (!user.referralCode) {
            const code = nanoid(8);
            user = await prisma.user.update({
                where: { id: userId },
                data: { referralCode: code },
                include: { referrals: true }
            });
        }

        // Calculate stats
        const referralCount = user.referrals.length;
        // Calculate total earnings from referrals
        const earnings = await prisma.transaction.aggregate({
            where: {
                userId: userId,
                type: "referral_bonus"
            },
            _sum: {
                amount: true
            }
        });

        return NextResponse.json({
            referralCode: user.referralCode,
            referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referralCode}`, // Updated to point to correct route
            referralCount,
            totalEarnings: earnings._sum.amount || 0,
            hasReferrer: !!user.referredById
        });

    } catch (error) {
        console.error("Referral API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


