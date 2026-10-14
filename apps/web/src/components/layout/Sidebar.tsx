"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { chatApi } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/history", label: "Riwayat", icon: History },
  { href: "/documents", label: "Dokumen", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [convExpanded, setConvExpanded] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.listConversations,
  });

  const recentConvs = data?.items?.slice(0, 5) ?? [];

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/login");
  };

  return (
    <>
      <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Bot className="text-white" size={18} aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-gray-900">AI Chatbot</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                pathname.startsWith(href)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}

          {user?.role === "admin" && (
            <Link
              href="/dashboard"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                pathname.startsWith("/dashboard")
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              Dashboard
            </Link>
          )}

          {/* Percakapan Terbaru */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setConvExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
              aria-expanded={convExpanded}
              aria-controls="recent-conversations"
            >
              <span>Percakapan Terbaru</span>
              {convExpanded ? (
                <ChevronUp size={13} aria-hidden="true" />
              ) : (
                <ChevronDown size={13} aria-hidden="true" />
              )}
            </button>

            {convExpanded && (
              <ul id="recent-conversations" className="mt-1 space-y-0.5">
                {recentConvs.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-gray-400">Belum ada percakapan</li>
                ) : (
                  recentConvs.map((conv) => (
                    <li key={conv.id}>
                      <Link
                        href={`/chat?conv=${conv.id}`}
                        className={clsx(
                          "flex items-center rounded-lg px-3 py-2 text-xs transition truncate",
                          pathname.includes(conv.id)
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        title={conv.title}
                      >
                        <span className="truncate">{conv.title}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </nav>

        {/* User menu */}
        <div className="border-t border-gray-100 p-4">
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <span
              className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 capitalize"
              aria-label="Role pengguna"
            >
              {user?.role}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <LogOut size={16} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Keluar"
        message="Yakin ingin keluar dari aplikasi?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
