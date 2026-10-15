import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RelativeTime from "@/components/ui/RelativeTime";
import { useToast } from "@/contexts/ToastContext";
import { documentsApi, getApiError, type Document } from "@/lib/api";
import {
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  Search,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Layers,
} from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ActiveUpload {
  name: string;
  progress: number;
}

type StatusFilter = "all" | "completed" | "processing" | "issue";

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  // Fase 6 Polish: Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  const loadDocuments = useCallback(() => {
    documentsApi
      .list()
      .then((res) => setDocuments(res.items))
      .catch((err) => addToast({ type: "error", message: getApiError(err) }))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(() => {
      documentsApi.list().then((res) => {
        setDocuments(res.items);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await documentsApi.delete(deleteTarget.id);
      addToast({ type: "success", message: "Dokumen berhasil dihapus" });
      setDeleteTarget(null);
      loadDocuments();
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    try {
      await documentsApi.reprocess(id);
      addToast({ type: "info", message: "Dokumen dijadwalkan ulang untuk diproses" });
      loadDocuments();
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    } finally {
      setReprocessingId(null);
    }
  };

  const uploadWithProgress = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setActiveUploads((prev) => [...prev, { name: file.name, progress: 0 }]);

      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 25;
        if (progress >= 100) {
          clearInterval(progressTimer);
          setActiveUploads((prev) => prev.filter((u) => u.name !== file.name));
          documentsApi
            .upload(file)
            .then(() => {
              loadDocuments();
              addToast({ type: "success", message: `"${file.name}" berhasil diunggah` });
              resolve();
            })
            .catch((err) => {
              addToast({ type: "error", message: getApiError(err) });
              resolve();
            });
        } else {
          setActiveUploads((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress } : u))
          );
        }
      }, 150);
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => uploadWithProgress(f));
  };

  const isUploading = activeUploads.length > 0;

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.original_name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (statusFilter === "completed") return doc.status === "completed";
      if (statusFilter === "processing") return doc.status === "processing" || doc.status === "queued" || doc.status === "uploaded";
      if (statusFilter === "issue") return doc.status === "failed" || doc.status === "needs_review";
      return true;
    });
  }, [documents, search, statusFilter]);

  const totalBytes = useMemo(() => {
    return documents.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
  }, [documents]);

  const getDocIcon = (filename: string) => {
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".csv")) {
      return <FileSpreadsheet size={20} className="text-emerald-600" />;
    }
    return <FileText size={20} className="text-blue-600" />;
  };

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-xs">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dokumen</h1>
                <p className="text-xs text-gray-500">
                  Basis pengetahuan AI (PDF, Excel, Spreadsheet & Gambar)
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs">
              <span className="font-semibold text-gray-900">{documents.length} Dokumen</span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-600 font-medium">
                {documents.filter((d) => d.status === "completed").length} Siap RAG
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">{formatBytes(totalBytes)}</span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Area upload dokumen — klik atau drag & drop file ke sini"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={`mb-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 md:p-10 text-center cursor-pointer transition shadow-xs ${
              dragOver
                ? "border-primary-500 bg-primary-50/70"
                : "border-gray-300 bg-white hover:bg-gray-50 hover:border-primary-400"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Upload
                className={`${isUploading ? "animate-bounce text-primary-500" : "text-primary-600"}`}
                size={26}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isUploading ? "Mengunggah berkas..." : "Drag & drop atau klik untuk upload"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Format didukung: <span className="font-medium text-gray-700">PDF, Excel (.xlsx, .xls, .csv), Gambar (PNG, JPG)</span> — maks. 25 MB
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt,.md"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Active upload progress bars */}
          {activeUploads.length > 0 && (
            <div className="mb-6 space-y-2">
              {activeUploads.map((upload) => (
                <div
                  key={upload.name}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-xs">
                      {upload.name}
                    </p>
                    <span className="text-xs text-primary-600 font-semibold ml-2">
                      {upload.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-200"
                      style={{ width: `${upload.progress}%` }}
                      role="progressbar"
                      aria-valuenow={upload.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama dokumen..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 text-xs font-medium text-gray-600">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                Semua ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === "completed"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("processing")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === "processing"
                    ? "bg-white text-blue-700 shadow-xs font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                Diproses
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("issue")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === "issue"
                    ? "bg-white text-red-700 shadow-xs font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                Gagal/Review
              </button>
            </div>
          </div>

          {/* Documents list */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <FileText size={36} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  {search ? "Dokumen tidak ditemukan" : "Belum ada dokumen"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {search
                    ? `Tidak ada dokumen yang cocok dengan kata kunci "${search}"`
                    : "Silakan unggah dokumen PDF, Excel (.xlsx/.xls), atau gambar untuk memulai"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/80 transition group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 transition group-hover:border-primary-200 group-hover:bg-primary-50/50">
                        {getDocIcon(doc.original_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {doc.original_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>•</span>
                          <RelativeTime date={doc.created_at} />
                          {doc.chunks && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-primary-600">
                                <Layers size={11} /> {doc.chunks.length} Chunk
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <DocumentStatusBadge status={doc.status} />

                      {/* Detail / View Chunks Button */}
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                        title="Lihat teks hasil ekstraksi RAG"
                        aria-label="Lihat detail dokumen"
                      >
                        <Eye size={16} />
                      </button>

                      {["failed", "needs_review", "queued"].includes(doc.status) && (
                        <button
                          type="button"
                          onClick={() => handleReprocess(doc.id)}
                          disabled={reprocessingId === doc.id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Proses ulang"
                          aria-label="Proses ulang dokumen"
                        >
                          <RefreshCw
                            size={16}
                            className={reprocessingId === doc.id ? "animate-spin text-primary-600" : ""}
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: doc.id, name: doc.original_name })
                        }
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
                        title="Hapus dokumen"
                        aria-label="Hapus dokumen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Detail Modal (Fase 3 & 6) */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                {getDocIcon(viewingDoc.original_name)}
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {viewingDoc.original_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block">Status Ingestion:</span>
                  <span className="font-semibold capitalize text-gray-800">
                    {viewingDoc.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Ukuran File:</span>
                  <span className="font-semibold text-gray-800">
                    {formatBytes(viewingDoc.file_size)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">MIME Type:</span>
                  <span className="font-semibold text-gray-800 truncate block">
                    {viewingDoc.mime_type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Total Chunks:</span>
                  <span className="font-semibold text-primary-600">
                    {viewingDoc.chunks?.length ?? 0} Unit
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Layers size={14} className="text-primary-600" /> Hasil Ekstraksi Konten (RAG Chunks)
                </h4>
                {viewingDoc.chunks && viewingDoc.chunks.length > 0 ? (
                  <div className="space-y-3">
                    {viewingDoc.chunks.map((chunk, idx) => (
                      <div
                        key={chunk.id || idx}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed"
                      >
                        <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-1.5 text-gray-500 font-sans font-semibold">
                          <span>Chunk #{idx + 1} (Hal. {chunk.page || 1})</span>
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle size={12} /> Terindeks RAG
                          </span>
                        </div>
                        {chunk.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Belum ada potongan teks (chunk) yang diekstraksi untuk dokumen ini.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Dokumen"
        message={`Yakin ingin menghapus dokumen "${deleteTarget?.name ?? ""}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ProtectedLayout>
  );
}
