import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import QueryClientProvider from "@/providers/QueryClientProvider";
import AuthSessionProvider from "@/providers/SessionProvider";
import { ToastProvider } from "@/components/ui/toast";

const plusJakartaSans = localFont({
    src: "../../public/fonts/PlusJakartaSans-VariableFont.ttf",
    variable: "--font-sans",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-input",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: "SalmanAid : Your Funding Solution",
    description: "A charity-based funding program established by Rumah Amal Salman",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${plusJakartaSans.variable} ${plusJakartaSans.className} ${inter.variable} font-sans antialiased bg-[#F9FAFB] min-h-screen flex flex-col`}
            >
                <AuthSessionProvider>
                    <QueryClientProvider>
                        <ToastProvider>
                            <div className="flex min-h-screen flex-col">
                                <main className="flex-1">{children}</main>
                            </div>
                        </ToastProvider>
                    </QueryClientProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
