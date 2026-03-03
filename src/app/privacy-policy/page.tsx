import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
                <Link href="/home" className="inline-flex items-center text-primary hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-6 border-b border-border pb-4">Privacy Policy</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                    <p>We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, and in connection with other activities, services, features or resources we make available on our Site. Users may be asked for, as appropriate, email address, name, and necessary KYC documentation.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Collected Information</h2>
                    <p>GameVerse may collect and use Users' personal information for the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To run and operate our Site</li>
                        <li>To improve customer service</li>
                        <li>To personalize user experience</li>
                        <li>To process payments and withdrawals</li>
                        <li>To send periodic emails</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. How We Protect Your Information</h2>
                    <p>We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information, username, password, transaction information and data stored on our Site.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Sharing Your Personal Information</h2>
                    <p>We do not sell, trade, or rent Users' personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates and advertisers.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
