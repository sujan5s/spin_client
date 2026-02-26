import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { GoogleAuthProvider } from "@/providers/GoogleAuthProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameVerse",
  description: "The ultimate gaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <GoogleAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || "385258266258-4027iettuparmurmk7rjlm474frm27aa.apps.googleusercontent.com"}>
          <AuthProvider>
            <WalletProvider>
              {children}
              <Toaster position="top-center" richColors />
            </WalletProvider>
          </AuthProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
