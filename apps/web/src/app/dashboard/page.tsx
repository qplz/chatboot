"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { documentsApi, chatApi } from "@/lib/api";
import { FileText, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: docs } = useQuery({ queryKey: ["documents"], queryFn: documentsApi.list });
  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.listConversations,
  });

  return (
    <ProtectedLayout requiredRole="admin">
      <div className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Dokumen"
              value={docs?.total ?? "—"}
              icon={<FileText className="text-blue-600" size={22} />}
              color="bg-blue-50"
            />
            <StatCard
              label="Total Percakapan"
              value={convs?.total ?? "—"}
              icon={<MessageSquare className="text-green-600" size={22} />}
              color="bg-green-50"
            />
            <StatCard
              label="Dokumen Selesai"
              value={docs?.items?.filter((d) => d.status === "completed").length ?? "—"}
              icon={<CheckCircle className="text-purple-600" size={22} />}
              color="bg-purple-50"
            />
            <StatCard
              label="Total Pesan"
              value="—"
              icon={<MessageSquare className="text-amber-600" size={22} />}
              color="bg-amber-50"
            />
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            {/* Section header with "Lihat Semua" link */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Dokumen Terbaru</h2>
              <Link
                href="/documents"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
              >
                Lihat Semua
                <ArrowRight size={14} />
              </Link>
            </div>

            {!docs?.items?.length ? (
              <p className="text-sm text-gray-400">Belum ada dokumen.</p>
            ) : (
              <div className="divide-y">
                {docs.items.slice(0, 10).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition"
                    onClick={() => router.push("/documents")}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat dokumen ${doc.original_name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") router.push("/documents");
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate max-w-xs">
                        {doc.original_name}
                      </p>
                      <p className="text-xs text-gray-400">{formatBytes(doc.file_size)}</p>
                    </div>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
