"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { Bell, LogOut, User, Settings, X, Menu } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const { balance } = useWallet();
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState<any[]>([]);
    const lastNotificationIdRef = useRef<number | null>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();

                // Check for new notifications
                if (data.length > 0) {
                    const latestId = data[0].id;

                    // If we have a last known ID, check for newer ones
                    if (lastNotificationIdRef.current !== null) {
                        const newItems = data.filter((n: any) => n.id > lastNotificationIdRef.current!);

                        // Add new items to toasts
                        if (newItems.length > 0) {
                            newItems.forEach((item: any) => {
                                setToasts(prev => [...prev, { ...item, toastId: Date.now() + Math.random() }]);
                            });
                        }
                    }

                    lastNotificationIdRef.current = latestId;
                }

                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Remove toast after 5 seconds
    useEffect(() => {
        if (toasts.length > 0) {
            const timer = setTimeout(() => {
                setToasts(prev => prev.slice(1)); // Remove the oldest toast
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toasts]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000); // Poll more frequently (5s) for better responsiveness
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 relative z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Welcome back, {user?.name || "Gamer"}</h2>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Balance Display */}
                    <div className="flex items-center rounded-full bg-secondary px-4 py-1.5 border border-border">
                        <span className="text-sm text-muted-foreground mr-2">Balance:</span>
                        <TokenIcon className="mr-1" size={16} />
                        <span className="text-lg font-bold text-primary">{balance.toFixed(2)}</span>
                    </div>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                                >
                                    <div className="p-4 border-b border-border flex justify-between items-center">
                                        <h3 className="font-semibold">Notifications</h3>
                                        <button onClick={() => setIsNotificationsOpen(false)}>
                                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-muted-foreground text-sm">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div key={notification.id} className="p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-medium text-sm">{notification.title}</h4>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {notification.message.split(/(\$)/g).map((part: string, i: number) =>
                                                            part === "$" ? "₹" : part
                                                        )}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold hover:ring-2 hover:ring-accent/50 transition-all"
                        >
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                                >
                                    <div className="p-4 border-b border-border">
                                        <p className="font-medium truncate">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                        <div className="h-px bg-border my-1"></div>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileOpen(false);
                                            }}
                                            className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Logout
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.toastId}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className="bg-card border border-border p-4 rounded-xl shadow-2xl w-80 pointer-events-auto flex items-start gap-3"
                        >
                            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {toast.type === 'success' ? <TokenIcon size={20} /> : <Bell className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{toast.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {toast.message.split(/(\$)/g).map((part: string, i: number) =>
                                        part === "$" ? "₹" : part
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
