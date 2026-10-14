import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RelativeTime from "@/components/ui/RelativeTime";
import { useToast } from "@/contexts/ToastContext";
import { chatApi, getApiError, type Conversation } from "@/lib/api";
import { History, MessageSquare, Search, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const filteredItems = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <History size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Percakapan</h1>
              <p className="text-xs text-gray-500">Kelola riwayat tanya jawab Anda</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white py-16 text-center shadow-sm border border-gray-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare className="text-gray-400" size={28} />
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">Belum ada percakapan</p>
                <p className="text-xs text-gray-400 mt-0.5">Mulai bertanya seputar dokumen Anda</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition shadow-sm"
              >
                Mulai Chat
              </button>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-sm">
                <Search size={16} className="shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari percakapan..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  aria-label="Cari percakapan"
                />
              </div>

              {filteredItems.length === 0 && search ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-12 text-center shadow-sm border border-gray-100">
                  <Search className="text-gray-300" size={36} />
                  <p className="text-sm text-gray-400">
                    Tidak ada percakapan yang cocok dengan &ldquo;{search}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition cursor-pointer group"
                      onClick={() => navigate(`/chat?conv=${conv.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") navigate(`/chat?conv=${conv.id}`);
                      }}
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {conv.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <RelativeTime
                            date={conv.updated_at}
                            className="text-xs text-gray-400"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: conv.id, title: conv.title });
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
                        aria-label="Hapus percakapan"
                      >
                        <Trash2 size={16} />
                      </button>
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
