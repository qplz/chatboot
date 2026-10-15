import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RelativeTime from "@/components/ui/RelativeTime";
import { useToast } from "@/contexts/ToastContext";
import { chatApi, getApiError, type Conversation } from "@/lib/api";
import { History, MessageSquare, Search, Trash2, Edit2, Check, X, Download } from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit title state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const loadData = useCallback(() => {
    setIsLoading(true);
    chatApi
      .listConversations()
      .then((res) => setConversations(res.items))
      .catch((err) => addToast({ type: "error", message: getApiError(err) }))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await chatApi.deleteConversation(deleteTarget.id);
      addToast({ type: "success", message: "Percakapan berhasil dihapus" });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await chatApi.updateConversationTitle(id, editingTitle.trim());
      addToast({ type: "success", message: "Judul percakapan berhasil diubah" });
      setEditingId(null);
      loadData();
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    }
  };

  const handleExport = async (conv: Conversation) => {
    try {
      const detail = await chatApi.getConversation(conv.id);
      const lines = [
        `# ${detail.title}`,
        `Tanggal: ${new Date(detail.created_at).toLocaleDateString("id-ID")}`,
        "",
        "---",
        "",
      ];

      detail.messages.forEach((m) => {
        lines.push(`### ${m.role === "user" ? "Pengguna" : "Asisten AI"}`);
        lines.push(m.content);
        if (m.sources && m.sources.length > 0) {
          lines.push("");
          lines.push("**Sumber Rujukan:**");
          m.sources.forEach((s) => {
            lines.push(`- ${s.document_name} (Hal. ${s.page ?? 1})`);
          });
        }
        lines.push("");
      });

      const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-${detail.title.replace(/\s+/g, "_")}.md`;
      link.click();
      URL.revokeObjectURL(url);
      addToast({ type: "success", message: "Percakapan diekspor ke Markdown" });
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    }
  };

  const filteredItems = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-xs">
                <History size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Percakapan</h1>
                <p className="text-xs text-gray-500">Kelola dan telusuri riwayat tanya jawab dokumen</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition shadow-xs"
            >
              Mulai Chat Baru
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white py-16 text-center shadow-xs border border-gray-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare className="text-gray-400" size={28} />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">Belum ada percakapan</p>
                <p className="text-xs text-gray-400 mt-1">Mulai mengajukan pertanyaan seputar dokumen Anda</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition shadow-xs"
              >
                Buka Chat Sekarang
              </button>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-xs">
                <Search size={16} className="shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari topik atau riwayat percakapan..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  aria-label="Cari percakapan"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filteredItems.length === 0 && search ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-12 text-center shadow-xs border border-gray-100">
                  <Search className="text-gray-300" size={36} />
                  <p className="text-sm text-gray-500">
                    Tidak ada percakapan yang cocok dengan &ldquo;{search}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-xs border border-gray-200/70 hover:shadow-sm hover:border-primary-300 transition cursor-pointer group"
                      onClick={() => {
                        if (editingId !== conv.id) navigate(`/chat?conv=${conv.id}`);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (editingId !== conv.id) navigate(`/chat?conv=${conv.id}`);
                        }
                      }}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        {editingId === conv.id ? (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="rounded-lg border border-primary-500 px-2.5 py-1 text-sm font-medium text-gray-900 w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(conv.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(conv.id)}
                              className="rounded-lg bg-primary-600 p-1.5 text-white hover:bg-primary-700"
                              title="Simpan"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-gray-200 p-1.5 text-gray-700 hover:bg-gray-300"
                              title="Batal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {conv.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <RelativeTime
                                date={conv.updated_at}
                                className="text-xs text-gray-400"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(conv.id);
                            setEditingTitle(conv.title);
                          }}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Ganti judul"
                          aria-label="Ganti judul"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport(conv)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Ekspor ke Markdown"
                          aria-label="Ekspor chat"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: conv.id, title: conv.title })
                          }
                          className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Hapus percakapan"
                          aria-label="Hapus percakapan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Percakapan"
        message={`Yakin ingin menghapus percakapan "${deleteTarget?.title ?? ""}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ProtectedLayout>
  );
}
