"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    email: string;
    name: string | null;
    balance: number;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, name: string, password: string) => Promise<void>;
    googleLogin: (token: string, referralCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // ... existing code ...



    const login = async (email: string, password: string) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Login failed");
            }

            const data = await res.json();
            setUser(data.user);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login error", error);
            throw error;
        }
    };

    const signup = async (email: string, name: string, password: string) => {
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Signup failed");
            }

            const data = await res.json();
            setUser(data.user);
            router.push("/dashboard");
        } catch (error) {
            console.error("Signup error", error);
            throw error;
        }
    };

    const googleLogin = async (token: string, referralCode?: string) => {
        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, referralCode }),
            });

            if (!res.ok) {
                const error = await res.json();
                console.error("Google Login Server Error:", error);
                throw new Error(error.error || "Google Login failed");
            }

            const data = await res.json();
            setUser(data.user);
            router.push("/dashboard");
        } catch (error) {
            console.error("Google Login error", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                signup,
                googleLogin,
                logout,
                refreshUser: checkAuth,
                isAuthenticated: !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
