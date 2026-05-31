
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2, ChevronDown, CircleDollarSign, Info, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import RumahAmalHorizontalLogo from "../../../../public/rumah-amal-horizontal-logo.svg"
import UserPersonaLogo from "../../../../public/user_persona.svg"

import { useUserStore } from "@/hooks/userStore";
import localFont from "next/font/local";
import { signOut, useSession } from "next-auth/react";
import AccountVerificationBanner from "@/components/ui/account-verification-banner";

type NotificationItem = {
    id: string;
    type: string;
    message: string;
    scheduledAt: string;
    sentAt: string | null;
    isPending: boolean;
};

type NotificationsResponse = {
    pendingCount: number;
    notifications: NotificationItem[];
};

const menuItems = [
    { href: "/applicant/dashboard", label: "Dashboard" },
    { href: "/applicant/apply", label: "Pengajuan Pinjaman" },
    { href: "/applicant/installment", label: "Cicilan" },
];

// init fonts
const plusJakartaSansFont = localFont({
    src: "../../../../public/fonts/PlusJakartaSans-VariableFont.ttf",
    display: 'swap',
});

function formatNotificationTime(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getNotificationVisual(type: string) {
    if (type === "LOAN_APPROVED") {
        return {
            icon: CheckCircle2,
            iconClassName: "bg-[#ECFDF5] text-[#059669]",
            railClassName: "bg-[#10B981]",
            label: "Approved",
        };
    }

    if (type === "LOAN_REJECTED") {
        return {
            icon: XCircle,
            iconClassName: "bg-[#FEF2F2] text-[#DC2626]",
            railClassName: "bg-[#EF4444]",
            label: "Rejected",
        };
    }

    if (type === "LOAN_FUNDING_ALLOCATED" || type === "DONATION_ALLOCATED") {
        return {
            icon: CircleDollarSign,
            iconClassName: "bg-[#FFFBEB] text-[#D97706]",
            railClassName: "bg-[#FCB82E]",
            label: "Funding",
        };
    }

    return {
        icon: Info,
        iconClassName: "bg-[#EFF6FF] text-[#2563EB]",
        railClassName: "bg-[#3B82F6]",
        label: "Update",
    };
}

function showDesktopNotification(notification: NotificationItem) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification("SalmanAid notification", {
        body: notification.message,
        tag: notification.id,
    });
}

function NotificationBellButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }

        return "default";
    });
    const containerRef = useRef<HTMLDivElement | null>(null);
    const deliveredIdsRef = useRef<Set<string>>(new Set());

    const fetchNotifications = useCallback(async () => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);
            const response = await fetch("/api/notifications?limit=5", {
                cache: "no-store",
            });

            if (response.status === 401) {
                setNotifications([]);
                setPendingCount(0);
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error("NOTIFICATIONS_FETCH_FAILED");
            }

            const data = (await response.json()) as NotificationsResponse;
            setNotifications(data.notifications);
            setPendingCount(data.pendingCount);
        } catch {
            setError("Notifications unavailable");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestDesktopPermission = useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            setDesktopPermission(permission);
            return;
        }

        setDesktopPermission(Notification.permission);
    }, []);

    useEffect(() => {
        const notificationFetchTimer = window.setTimeout(() => {
            fetchNotifications();
        }, 0);

        const events = new EventSource("/api/notifications/events");

        events.addEventListener("notification", (event) => {
            const notification = JSON.parse(event.data) as NotificationItem;

            if (deliveredIdsRef.current.has(notification.id)) return;
            deliveredIdsRef.current.add(notification.id);

            setNotifications((current) => [
                notification,
                ...current.filter((item) => item.id !== notification.id),
            ].slice(0, 5));
            setPendingCount((current) => Math.max(current - 1, 0));
            showDesktopNotification(notification);
        });

        events.onerror = () => {
            setError("Reconnecting notifications...");
        };

        events.addEventListener("connected", () => {
            setError(null);
        });

        const handleOnline = () => fetchNotifications();
        const handleFocus = () => fetchNotifications();

        window.addEventListener("online", handleOnline);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.clearTimeout(notificationFetchTimer);
            events.close();
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    const visibleBadgeCount = pendingCount > 9 ? "9+" : pendingCount.toString();

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => {
                    setIsOpen((current) => !current);
                    requestDesktopPermission();
                    fetchNotifications();
                }}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[#111827] transition hover:border-[#07B0C8] hover:bg-[#F0FBFD] focus:outline-none focus:ring-2 focus:ring-[#07B0C8]/30"
            >
                <Bell size={18} strokeWidth={2.2} />
                {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                        {visibleBadgeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                    <div className="fixed left-4 right-4 md:absolute md:left-auto md:right-0 top-16 md:top-12 z-50 w-auto md:w-md max-w-none md:max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">                    <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className={`${plusJakartaSansFont.className} text-base font-bold text-[#111827]`}>
                                    Notifikasi
                                </div>
                                <div className="mt-1 text-xs text-[#6B7280]">
                                    Pembaruan pinjaman dan donasi terkini
                                </div>
                            </div>
                            {pendingCount > 0 && (
                                <div className="rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
                                    {pendingCount} terbaru
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="max-h-112 space-y-3 overflow-y-auto bg-white p-4">
                        {isLoading && (
                            <div className="rounded-lg border border-[#E5E7EB] px-4 py-6 text-sm text-[#6B7280]">
                                Memuat Notifikasi...
                            </div>
                        )}

                        {!isLoading && error && (
                            <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-4 text-sm text-[#B45309]">
                                {error}
                            </div>
                        )}

                        {!isLoading && !error && notifications.length === 0 && (
                            <div className="rounded-lg border border-dashed border-[#D1D5DB] px-4 py-8 text-center text-sm text-[#6B7280]">
                                Belum ada notifikasi.
                            </div>
                        )}

                        {!isLoading && !error && notifications.map((notification) => {
                            const visual = getNotificationVisual(notification.type);
                            const Icon = visual.icon;

                            return (
                                <div
                                    key={notification.id}
                                    className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm"
                                >
                                    <div className={`absolute inset-y-0 left-0 w-1 ${visual.railClassName}`} />
                                    <div className="flex items-start gap-3 px-4 py-4 pl-5">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.iconClassName}`}>
                                            <Icon size={20} strokeWidth={2.2} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    {visual.label}
                                                </div>
                                                <div className="shrink-0 text-xs text-[#6B7280]">
                                                    {formatNotificationTime(notification.scheduledAt)}
                                                </div>
                                            </div>
                                            <div className="mt-1 text-sm leading-6 text-[#111827]">
                                                {notification.message}
                                            </div>
                                            {notification.isPending && (
                                                <div className="mt-2 inline-flex rounded-full bg-[#FFF7E6] px-2.5 py-1 text-xs font-medium text-[#B45309]">
                                                    Baru saja diterima
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-xs text-[#6B7280]">
                        {desktopPermission === "granted"
                            ? "Notifikasi Desktop diaktifkan"
                            : "Tekan ikon bel untuk mengaktifkan notifikasi desktop"}
                    </div>
                </div>
            )}
        </div>
    );
}

type ApplicantNavbarProps = {
    showNotifications?: boolean;
};

export default function ApplicantDashboard_ApplicantNavbar({ showNotifications = true }: ApplicantNavbarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const usernameFromStore = useUserStore((state) => (state.user?.username));
    const username = useMemo(() => {
        return usernameFromStore || session?.user?.name || "Borrower";
    }, [session?.user?.name, usernameFromStore]);
    const roles = ((session?.user as { roles?: string[] } | undefined)?.roles || []) as string[];
    const donorAction = roles.includes("DONOR")
        ? { href: "/donor/dashboard", label: "Ganti Role (Donatur)" }
        : { href: "/account/roles?role=DONOR&from=BORROWER", label: "Daftar sebagai Donatur" };
    
    return (
        <>
        <nav className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white shadow-sm">
            <div className="mx-auto max-w-350 px-6">
                <div className="flex h-14.5 items-center justify-between">
                    
                    {/* Logo */}
                    <Link href="/applicant/dashboard" className="shrink-0 flex items-center">
                        <Image
                            src={RumahAmalHorizontalLogo}
                            alt="Logo Rumah Amal Salman"
                            width={122}
                            height={30}
                            className="h-7 w-auto"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation Menus (Hidden on Mobile) */}
                    <div className="hidden items-center gap-10 md:flex">
                        {menuItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/applicant/dashboard" && pathname?.startsWith(item.href));

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`text-[12.5px] font-medium transition-colors ${
                                        isActive
                                            ? "text-[#07B0C8] underline decoration-2 underline-offset-8 decoration-[#07B0C8]"
                                            : "text-gray-800 hover:text-cyan-600"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Controls Container */}
                    <div className="flex items-center gap-3">
                        {showNotifications && <NotificationBellButton />}

                        {/* Profile & Mobile Menu Dropdown */}
                        <div className="group relative">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 transition-colors hover:bg-gray-50 focus:outline-none"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFF3F7]">
                                    <Image
                                        src={UserPersonaLogo}
                                        alt="User"
                                        width={16}
                                        height={16}
                                        className="h-4 w-4"
                                    />
                                </span>
                                <span className="max-w-20 xs:max-w-24 sm:max-w-27.5 truncate text-[12.5px] font-medium text-[#111827]" title={username}>
                                    {username}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500 transition-transform duration-150 group-hover:rotate-180" />
                            </button>

                            {/* Responsive Dropdown Box */}
                            <div className="invisible absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                                
                                {/* Mobile Menu Section (Hidden on Desktop) */}
                                <div className="flex flex-col border-b border-gray-100 pb-1.5 mb-1.5 md:hidden">
                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Menu
                                    </div>
                                    {menuItems.map((item) => {
                                        const isActive =
                                            pathname === item.href ||
                                            (item.href !== "/applicant/dashboard" && pathname?.startsWith(item.href));

                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition-colors ${
                                                    isActive 
                                                        ? "bg-[#F0FBFD] text-[#07B0C8]" 
                                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#07B0C8]"
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Account / Action Section */}
                                <div className="flex flex-col gap-1">
                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider md:hidden">
                                        Akun
                                    </div>
                                    <Link
                                        href="/profile?from=BORROWER"
                                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#07B0C8]"
                                    >
                                        Profil
                                    </Link>
                                    <Link
                                        href={donorAction.href}
                                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[12.5px] font-bold text-[#07B0C8] transition-colors hover:bg-[#F0FBFD]"
                                    >
                                        {donorAction.label}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#07B0C8]"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <AccountVerificationBanner role="BORROWER" />
        </>
    );
}
