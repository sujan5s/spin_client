"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Trophy, Wallet, User as UserIcon } from "lucide-react";
import { TokenIcon } from "@/components/TokenIcon";

interface User {
    id: number;
    name: string;
    email: string;
    balance: number;
    joinedAt: string;
    luckyDraws: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Users Overview</h1>
                    <p className="text-gray-400">Manage your platform users and track their activities.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-64"
                    />
                </div>
            </div>

            {/* Stats Cards Row (Optional - just aggregated stats from the list) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/20 text-blue-500 rounded-lg">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Users</p>
                            <h3 className="text-2xl font-bold">{users.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-600/20 text-green-500 rounded-lg">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Holdings</p>
                            <h3 className="text-2xl font-bold flex items-center gap-1"><TokenIcon size={24} />{users.reduce((acc, u) => acc + u.balance, 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-600/20 text-yellow-500 rounded-lg">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Lucky Draws Taken</p>
                            <h3 className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.luckyDraws, 0)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800 text-gray-400 text-sm uppercase">
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Joined</th>
                                <th className="p-4 font-medium text-right">Balance</th>
                                <th className="p-4 font-medium text-center">Lucky Draws</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-gray-500 text-xs">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {new Date(user.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-medium text-green-400 flex justify-end items-center gap-1">
                                            <TokenIcon size={14} />{user.balance.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-500">
                                                {user.luckyDraws}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                Details <ChevronRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
