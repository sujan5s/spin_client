"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, Users, Coins } from "lucide-react";

export default function ReferralPanel() {
    const [referralData, setReferralData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const res = await fetch("/api/referral");
            if (res.ok) {
                const data = await res.json();
                setReferralData(data);
            }
        } catch (err) {
            console.error("Failed to fetch referral data", err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (referralData?.referralLink) {
            navigator.clipboard.writeText(referralData.referralLink);
            setSuccess("Link copied!");
            setTimeout(() => setSuccess(""), 3000);
        }
    };



    if (loading) return <div className="p-4 text-center text-gray-400">Loading referral info...</div>;

    return (
        <div className="bg-[#1a1b1e] p-6 rounded-xl border border-gray-800 mt-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-[#00ff41]" /> Referral Program
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stats Section */}
                <div className="space-y-4">
                    <div className="bg-[#151618] p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-sm mb-1">Total Referrals</div>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            <Users size={24} className="text-blue-500" />
                            {referralData?.referralCount || 0}
                        </div>
                    </div>
                    <div className="bg-[#151618] p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-sm mb-1">Total Earnings</div>
                        <div className="text-3xl font-bold text-[#00ff41] flex items-center gap-2">
                            <Coins size={24} />
                            {referralData?.totalEarnings || 0}
                        </div>
                    </div>

                    <div className="bg-[#151618] p-4 rounded-lg border border-gray-800 mt-4">
                        <div className="text-white font-semibold mb-2">Rewards</div>
                        <ul className="text-gray-400 text-sm space-y-2">
                            <li>• You get <span className="text-[#00ff41]">100 tokens</span> when friend deposits</li>
                            <li>• Friend gets <span className="text-[#00ff41]">50 tokens</span> on first deposit</li>
                        </ul>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-6">
                    {/* Share Link */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Your Referral Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={referralData?.referralLink || ""}
                                className="flex-1 bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-gray-300 focus:outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="bg-[#00ff41] hover:bg-[#00cc33] text-black font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Copy size={18} /> Copy
                            </button>
                        </div>
                    </div>




                    {success && <div className="text-[#00ff41] text-sm bg-[#00ff41]/10 p-2 rounded">{success}</div>}
                </div>
            </div>
        </div>
    );
}
