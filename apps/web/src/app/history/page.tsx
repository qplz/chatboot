"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RelativeTime from "@/components/ui/RelativeTime";
import { useToast } from "@/contexts/ToastContext";
import { chatApi, getApiError } from "@/lib/api";
import { History, MessageSquare, Search, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.listConversations,
  });

  const deleteMutation = useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      addToast({ type: "success", message: "Percakapan berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiError(err) });
      setDeleteTarget(null);
    },
  });

  const filteredItems =
    data?.items?.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <History className="text-primary-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Percakapan</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white py-16 text-center shadow-sm">
              <MessageSquare className="text-gray-300" size={40} />
              <p className="text-gray-400">Belum ada percakapan</p>
              <button
                onClick={() => router.push("/chat")}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Mulai Chat
              </button>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400">
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
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-12 text-center shadow-sm">
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
                      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                      onClick={() => router.push(`/chat?conv=${conv.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conv.title}
                        </p>
                        <RelativeTime
                          date={conv.updated_at}
                          className="text-xs text-gray-400"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: conv.id, title: conv.title });
                        }}
                        className="ml-4 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-2 text-red-400 hover:bg-red-50 transition"
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
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ProtectedLayout>
  );
}
