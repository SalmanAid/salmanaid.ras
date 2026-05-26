"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  isVisible: boolean;
};

type ToastInput = {
  title: string;
  description?: string;
};

type ToastContextValue = {
  success: (toast: ToastInput) => void;
  error: (toast: ToastInput) => void;
  info: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 7200;
const TOAST_ANIMATION_MS = 320;

const toastStyle: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

const iconStyle: Record<ToastType, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-[#07B0C8]",
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") return <CheckCircle2 size={20} className={iconStyle[type]} />;
  if (type === "error") return <XCircle size={20} className={iconStyle[type]} />;
  return <Info size={20} className={iconStyle[type]} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, isVisible: false } : toast
    )));

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_ANIMATION_MS);
  }, []);

  const showToast = useCallback((type: ToastType, toast: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { id, type, isVisible: false, ...toast }]);

    window.requestAnimationFrame(() => {
      setToasts((current) => current.map((item) => (
        item.id === id ? { ...item, isVisible: true } : item
      )));
    });

    window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  }, [dismissToast]);

  const value = useMemo<ToastContextValue>(() => ({
    success: (toast) => showToast("success", toast),
    error: (toast) => showToast("error", toast),
    info: (toast) => showToast("info", toast),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border p-4 shadow-lg backdrop-blur transition-all duration-300 ease-out motion-reduce:transition-none ${toastStyle[toast.type]} ${
              toast.isVisible
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-6 scale-[0.98] opacity-0"
            }`}
            role="status"
          >
            <div className="flex items-start gap-3">
              <ToastIcon type={toast.type} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold">{toast.title}</div>
                {toast.description && (
                  <div className="mt-1 text-sm font-medium leading-5 opacity-90">{toast.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-md p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100"
                aria-label="Tutup notifikasi"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
