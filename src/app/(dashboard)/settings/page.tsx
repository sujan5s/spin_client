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

    // Delete Request State
    const [deletionReason, setDeletionReason] = useState("");
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [existingRequest, setExistingRequest] = useState<{ status: string; createdAt: string } | null>(null);
    const [deleteFormOpen, setDeleteFormOpen] = useState(false);

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

    const fetchExistingRequest = async () => {
        try {
            const res = await fetch("/api/settings/deletion-request");
            const data = await res.json();
            setExistingRequest(data.existing ?? null);
        } catch { /* silent */ }
    };

    const handleRequestDeletion = async () => {
        if (deletionReason.trim().length < 20) {
            setDeleteMessage({ type: "error", text: "Please provide at least 20 characters explaining why you want to delete your account." });
            return;
        }
        setIsDeleteLoading(true);
        setDeleteMessage(null);
        try {
            const res = await fetch("/api/settings/deletion-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: deletionReason }),
            });
            const data = await res.json();
            if (res.ok) {
                setDeleteMessage({ type: "success", text: "Your deletion request has been submitted. Our team will review it within 2–3 business days." });
                setDeletionReason("");
                setDeleteFormOpen(false);
                fetchExistingRequest();
            } else {
                setDeleteMessage({ type: "error", text: data.error ?? "Failed to submit" });
            }
        } catch {
            setDeleteMessage({ type: "error", text: "Something went wrong. Please try again." });
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
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2 text-red-500">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                </h3>
                <p className="text-red-500/60 text-sm mb-5">Account deletion is permanent and cannot be undone.</p>

                {existingRequest ? (
                    <div className={`rounded-lg p-4 text-sm ${existingRequest.status === "PENDING" ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400" :
                            existingRequest.status === "REJECTED" ? "bg-zinc-800 border border-zinc-700 text-zinc-400" :
                                "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        }`}>
                        {existingRequest.status === "PENDING" && "⏳ Your deletion request is pending admin review."}
                        {existingRequest.status === "REJECTED" && "❌ Your deletion request was rejected. Contact support for more info."}
                        {existingRequest.status === "APPROVED" && "✅ Your account has been scheduled for deletion."}
                    </div>
                ) : (
                    <>
                        {!deleteFormOpen ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                                <div>
                                    <div className="font-medium text-red-500">Request Account Deletion</div>
                                    <div className="text-sm text-red-500/70">Submit a request and our team will review it within 2–3 business days.</div>
                                </div>
                                <button
                                    onClick={() => { setDeleteFormOpen(true); setDeleteMessage(null); fetchExistingRequest(); }}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors shrink-0"
                                >
                                    Request Deletion
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label className="text-sm font-medium text-red-400 mb-1.5 block">Why do you want to delete your account? <span className="text-red-500/60">(min. 20 characters)</span></label>
                                    <textarea
                                        value={deletionReason}
                                        onChange={e => setDeletionReason(e.target.value)}
                                        rows={4}
                                        placeholder="Please explain in detail why you want to delete your account..."
                                        className="w-full bg-secondary/50 border border-red-500/20 focus:border-red-500/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                                    />
                                    <div className={`text-xs mt-1 text-right ${deletionReason.length >= 20 ? "text-green-500" : "text-muted-foreground"}`}>
                                        {deletionReason.length} / 20 min
                                    </div>
                                </div>

                                {deleteMessage && (
                                    <p className={`text-sm ${deleteMessage.type === "success" ? "text-green-500" : "text-red-400"}`}>
                                        {deleteMessage.text}
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setDeleteFormOpen(false); setDeleteMessage(null); }}
                                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRequestDeletion}
                                        disabled={isDeleteLoading || deletionReason.trim().length < 20}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40"
                                    >
                                        {isDeleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Submit Request
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
