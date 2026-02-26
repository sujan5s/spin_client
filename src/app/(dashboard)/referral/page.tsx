"use client";

import ReferralPanel from "@/components/ReferralPanel";

export default function ReferralPage() {
    return (
        <div className="h-full bg-[#0f1012] p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Referral Program</h1>
            <p className="text-gray-400 mb-8 max-w-2xl">
                Invite your friends and earn rewards! Get 100 tokens for every friend who makes their first deposit, and they get 50 tokens too!
            </p>
            <ReferralPanel />
        </div>
    );
}
