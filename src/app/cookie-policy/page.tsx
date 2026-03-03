import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
                <Link href="/home" className="inline-flex items-center text-primary hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-black mb-6 border-b border-border pb-4">Cookie Policy</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. What Are Cookies</h2>
                    <p>As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it and why we sometimes need to store these cookies. We will also share how you can prevent these cookies from being stored however this may downgrade or 'break' certain elements of the sites functionality.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Cookies</h2>
                    <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. The Cookies We Set</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account related cookies:</strong> If you create an account with us, we will use cookies for the management of the signup process and general administration.</li>
                        <li><strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page.</li>
                        <li><strong>Site preferences cookies:</strong> In order to provide you with a great experience on this site, we provide the functionality to set your preferences for how this site runs when you use it.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Disabling Cookies</h2>
                    <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site. Therefore, it is recommended that you do not disable cookies.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
