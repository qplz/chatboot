import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { documentsApi, chatApi, type Document } from "@/lib/api";
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
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
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
      // count all messages across conversations
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

  return (
    <ProtectedLayout requiredRole="admin">
      <div className="h-full overflow-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              Ringkasan sistem dan status dokumen RAG AI
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Dokumen"
              value={docs.length}
              icon={<FileText className="text-blue-600" size={22} />}
              color="bg-blue-50"
            />
            <StatCard
              label="Total Percakapan"
              value={totalConvs}
              icon={<MessageSquare className="text-green-600" size={22} />}
              color="bg-green-50"
            />
            <StatCard
              label="Dokumen Selesai"
              value={completedDocsCount}
              icon={<CheckCircle className="text-purple-600" size={22} />}
              color="bg-purple-50"
            />
            <StatCard
              label="Total Pesan"
              value={totalMessages > 0 ? totalMessages : "—"}
              icon={<MessageSquare className="text-amber-600" size={22} />}
              color="bg-amber-50"
            />
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            {/* Section header with "Lihat Semua" link */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Dokumen Terbaru</h2>
              <Link
                to="/documents"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
              >
                Lihat Semua
                <ArrowRight size={14} />
              </Link>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Belum ada dokumen.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {docs.slice(0, 10).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition"
                    onClick={() => navigate("/documents")}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat dokumen ${doc.original_name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") navigate("/documents");
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-sm">
                        {doc.original_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatBytes(doc.file_size)}</p>
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
