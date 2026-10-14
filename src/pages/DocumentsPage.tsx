import React, { useRef, useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RelativeTime from "@/components/ui/RelativeTime";
import { useToast } from "@/contexts/ToastContext";
import { documentsApi, getApiError, type Document } from "@/lib/api";
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ActiveUpload {
  name: string;
  progress: number;
}

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

  const loadDocuments = useCallback(() => {
    documentsApi
      .list()
      .then((res) => setDocuments(res.items))
      .catch((err) => addToast({ type: "error", message: getApiError(err) }))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    loadDocuments();
    // Poll every 2 seconds if there are active processing/queued items
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

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dokumen</h1>
              <p className="text-xs text-gray-500">
                Unggah dan kelola dokumen untuk basis pengetahuan AI
              </p>
            </div>
          </div>

          {/* Upload area */}
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
            className={`mb-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition shadow-sm ${
              dragOver
                ? "border-primary-500 bg-primary-50"
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
                {isUploading ? "Mengunggah..." : "Drag & drop atau klik untuk upload"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Excel (.xlsx, .xls), PNG, JPG, JPEG — maks. 25 MB</p>
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
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
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

          {/* Documents list */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Daftar Dokumen ({documents.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <FileText size={36} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">Belum ada dokumen</p>
                <p className="text-xs text-gray-400 mt-1">
                  Silakan unggah dokumen PDF, Excel, atau gambar untuk memulai
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {doc.original_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>•</span>
                          <RelativeTime date={doc.created_at} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <DocumentStatusBadge status={doc.status} />

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
                            className={reprocessingId === doc.id ? "animate-spin" : ""}
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
