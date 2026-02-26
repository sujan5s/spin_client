"use client";

import { useState } from "react";
import { Bell, Lock, Shield, Trash2, Moon, Sun, User as UserIcon, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user, refreshUser, logout } = useAuth();
    const router = useRouter();

    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Delete Account State
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const handleUpdateProfile = async () => {
        setIsProfileLoading(true);
        setProfileSuccess(false);
        try {
            const res = await fetch("/api/settings/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                setProfileSuccess(true);
                await refreshUser();
                setTimeout(() => setProfileSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Profile update error", error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setIsPasswordLoading(true);
        setPasswordMessage(null);
        try {
            const res = await fetch("/api/settings/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setPasswordMessage({ type: 'success', text: data.message });
                setCurrentPassword("");
                setNewPassword("");
            } else {
                setPasswordMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: "Failed to update password" });
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

        setIsDeleteLoading(true);
        try {
            const res = await fetch("/api/settings/delete-account", {
                method: "DELETE",
            });

            if (res.ok) {
                await logout();
                router.push("/login");
            } else {
                alert("Failed to delete account");
            }
        } catch (error) {
            console.error("Delete account error", error);
            alert("An error occurred");
        } finally {
            setIsDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and account security</p>
            </div>

            {/* Profile Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" /> Profile
                </h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-muted-foreground cursor-not-allowed"
                        />
                    </div>
                    <button
                        onClick={handleUpdateProfile}
                        disabled={isProfileLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {isProfileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {profileSuccess ? <><Check className="h-4 w-4" /> Saved</> : "Update Profile"}
                    </button>
                </div>
            </div>

            {/* Notifications (Mock UI) */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notifications
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-muted-foreground">Receive updates about your account activity</div>
                        </div>
                        <button
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifications ? "bg-primary" : "bg-secondary"}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Security
                </h3>
                <div className="space-y-4 max-w-md">
                    <h4 className="font-medium flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h4>
                    <div className="space-y-3">
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current Password"
                            className="w-full bg-secondary border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full bg-secondary border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                            onClick={handleChangePassword}
                            disabled={isPasswordLoading}
                            className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {isPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                        </button>

                        {passwordMessage && (
                            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {passwordMessage.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium text-red-500">Delete Account</div>
                        <div className="text-sm text-red-500/70">Permanently delete your account and all data</div>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleteLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {isDeleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
