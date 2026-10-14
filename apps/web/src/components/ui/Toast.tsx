"use client";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  onDismiss: (id: string) => void;
}

const config = {
  success: {
    bg: "bg-green-500",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-red-500",
    Icon: XCircle,
  },
  info: {
    bg: "bg-blue-500",
    Icon: Info,
  },
  warning: {
    bg: "bg-yellow-400",
    Icon: AlertTriangle,
  },
} as const;

export default function Toast({ id, type, message, onDismiss }: Props) {
  const { bg, Icon } = config[type];
  return (
    <div
      role="alert"
      className={clsx(
        "flex items-center gap-3 min-w-[260px] max-w-sm rounded-lg px-4 py-3 text-white shadow-lg animate-fade-in-up",
        bg
      )}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="flex-1 text-sm">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded p-0.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
