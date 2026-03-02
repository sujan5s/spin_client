import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import sharp from "sharp";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key");

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token");

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        const userId = Number(payload.userId);

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let kycDocumentUrl = "";

        // If it's an image, compress to WEBP using sharp
        if (file.type.startsWith("image/")) {
            const compressedBuffer = await sharp(buffer)
                .webp({ quality: 80 })
                .toBuffer();

            // Upload to UploadThing
            // UTApi requires a File object or similar
            const utFile = new File([new Uint8Array(compressedBuffer)], `kyc_${userId}_${Date.now()}.webp`, { type: "image/webp" });
            const response = await utapi.uploadFiles(utFile);

            if (response.error) {
                console.error("UploadThing Error:", response.error);
                return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
            }

            kycDocumentUrl = response.data.url;
        } else {
            // It's a PDF, upload as is
            const utFile = new File([new Uint8Array(buffer)], file.name, { type: file.type });
            const response = await utapi.uploadFiles(utFile);

            if (response.error) {
                console.error("UploadThing Error:", response.error);
                return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
            }

            kycDocumentUrl = response.data.url;
        }

        // Update database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: "PENDING",
                kycDocumentUrl
            }
        });

        return NextResponse.json({
            message: "KYC document uploaded successfully",
            kycStatus: updatedUser.kycStatus,
            kycDocumentUrl: updatedUser.kycDocumentUrl
        }, { status: 200 });

    } catch (error: any) {
        console.error("KYC Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
