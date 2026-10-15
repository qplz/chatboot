import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { documentsApi, chatApi, type Document } from "@/lib/api";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  FileSpreadsheet,
  Plus,
  Layers,
  Database,
} from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sublabel, icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{label}</p>
        {sublabel && (
          <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Document[]>([]);
  const [totalConvs, setTotalConvs] = useState<number>(0);
  const [totalMessages, setTotalMessages] = useState<number>(0);

  useEffect(() => {
    documentsApi.list().then((res) => {
      setDocs(res.items);
    });

    chatApi.listConversations().then(async (res) => {
      setTotalConvs(res.total);
      let msgCount = 0;
      for (const conv of res.items) {
        try {
          const detail = await chatApi.getConversation(conv.id);
          msgCount += detail.messages.length;
        } catch {
          // ignore
        }
      }
      setTotalMessages(msgCount);
    });
  }, []);

  const completedDocsCount = docs.filter((d) => d.status === "completed").length;
  const excelDocsCount = docs.filter(
    (d) => d.original_name.endsWith(".xlsx") || d.original_name.endsWith(".xls") || d.original_name.endsWith(".csv")
  ).length;
  const pdfDocsCount = docs.filter((d) => d.original_name.endsWith(".pdf")).length;

  return (
    <ProtectedLayout requiredRole="admin">
      <div className="h-full overflow-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header & Quick Action Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">
                Ringkasan sistem dan status dokumen RAG AI
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
              >
                <Plus size={14} />
                Unggah Dokumen
              </button>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition shadow-xs"
              >
                <MessageSquare size={14} />
                Mulai Chat Baru
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label="Total Dokumen"
              value={docs.length}
              sublabel={`${pdfDocsCount} PDF • ${excelDocsCount} Excel`}
              icon={<FileText className="text-blue-600" size={22} />}
              color="bg-blue-50"
            />
            <StatCard
              label="Total Percakapan"
              value={totalConvs}
              sublabel={`${totalMessages} pesan diproses`}
              icon={<MessageSquare className="text-emerald-600" size={22} />}
              color="bg-emerald-50"
            />
            <StatCard
              label="Dokumen Selesai"
              value={completedDocsCount}
              sublabel={docs.length > 0 ? `${Math.round((completedDocsCount / docs.length) * 100)}% siap RAG` : undefined}
              icon={<CheckCircle className="text-purple-600" size={22} />}
              color="bg-purple-50"
            />
            <StatCard
              label="Format Spreadsheet"
              value={excelDocsCount}
              sublabel="XLSX, XLS, CSV"
              icon={<FileSpreadsheet className="text-emerald-600" size={22} />}
              color="bg-emerald-50"
            />
          </div>

          {/* Recent Documents Table */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-primary-600" />
                <h2 className="text-base font-semibold text-gray-800">Dokumen Terbaru</h2>
              </div>
              <Link
                to="/documents"
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
              >
                Lihat Semua
                <ArrowRight size={13} />
              </Link>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Belum ada dokumen.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {docs.slice(0, 10).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 py-3 cursor-pointer hover:bg-gray-50/80 rounded-xl px-3 transition"
                    onClick={() => navigate("/documents")}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat dokumen ${doc.original_name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") navigate("/documents");
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {doc.original_name.endsWith(".xlsx") || doc.original_name.endsWith(".xls") || doc.original_name.endsWith(".csv") ? (
                        <FileSpreadsheet size={18} className="text-emerald-600 shrink-0" />
                      ) : (
                        <FileText size={18} className="text-blue-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-sm">
                          {doc.original_name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatBytes(doc.file_size)} • {doc.chunks?.length ?? 1} Chunk terindeks
                        </p>
                      </div>
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
