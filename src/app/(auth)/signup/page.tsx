"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Gamepad2, ArrowRight } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useSearchParams } from "next/navigation";

function SignupForm() {
    const [step, setStep] = useState<"details" | "otp">("details");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { signup, googleLogin } = useAuth();
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
        }
    }, [searchParams]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStep("otp");
            } else {
                alert("Failed to send OTP");
            }
        } catch (error) {
            alert("Error sending OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Pass OTP to signup function (need to update AuthContext or call API directly)
            // Since AuthContext.signup doesn't take OTP, we'll call API directly here for now
            // or update AuthContext. For simplicity, let's assume we update AuthContext or just call fetch here.
            // Actually, let's call the API directly to avoid changing AuthContext signature too much if not needed,
            // but consistent way is better. Let's use the API directly for this specific flow or update context.
            // Given the context is already updated to take 3 args, I'll update the context call to include OTP if I can,
            // but I didn't update the context signature for signup to take OTP.
            // Let's do a direct fetch here to keep context simple or update context.
            // I'll do direct fetch for now to avoid breaking other calls if any.

            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, password, otp, referralCode }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Signup failed");
            }

            // Auto login (or just redirect to login)
            // The API returns the user and cookie, so we can just reload or redirect.
            // But AuthContext state won't be updated unless we reload or manually set it.
            // Let's use window.location.href = "/dashboard" to force reload and get auth state.
            window.location.href = "/dashboard";

        } catch (error: any) {
            alert(error.message || "Signup failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLogin(tokenResponse.access_token, referralCode);
            } catch (error) {
                alert("Google Login Failed");
            }
        },
        onError: () => alert("Google Login Failed"),
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-background to-background"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-card/50 backdrop-blur-lg border border-border rounded-xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 border border-accent/50">
                        <Gamepad2 className="h-8 w-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Join the Game</h1>
                    <p className="text-muted-foreground mt-2">Create your account</p>
                </div>

                {step === "details" ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground transition-all"
                                placeholder="ProGamer123"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground transition-all"
                                placeholder="player@gameverse.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Referral Code (Optional)
                            </label>
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground transition-all"
                                placeholder="Enter referral code"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoading ? "Sending OTP..." : "Continue with Email"} <ArrowRight className="ml-2 h-5 w-5" />
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            className="w-full py-3 bg-white text-black font-bold rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center"
                        >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="text-center mb-4">
                            <p className="text-sm text-muted-foreground">
                                We sent a verification code to <span className="text-foreground font-medium">{email}</span>
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground transition-all text-center tracking-widest text-2xl"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoading ? "Verifying..." : "Verify & Create Account"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep("details")}
                            className="w-full text-sm text-muted-foreground hover:text-foreground"
                        >
                            Back to details
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-accent hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}
