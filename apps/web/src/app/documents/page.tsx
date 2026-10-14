"use client";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { documentsApi, getApiError } from "@/lib/api";
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.list,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasActive = items.some((d) =>
        ["queued", "processing"].includes(d.status)
      );
      return hasActive ? 3000 : 10000;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      addToast({ type: "success", message: "Dokumen berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiError(err) });
      setDeleteTarget(null);
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${BASE_URL}/api/v1/documents/${id}/reprocess`, {
        method: "POST",
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error("Reprocess failed");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const uploadWithProgress = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      // Track this upload
      setActiveUploads((prev) => [...prev, { name: file.name, progress: 0 }]);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/api/v1/documents`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setActiveUploads((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress: pct } : u))
          );
        }
      };

      xhr.onload = () => {
        // Remove from active uploads
        setActiveUploads((prev) => prev.filter((u) => u.name !== file.name));
        if (xhr.status >= 200 && xhr.status < 300) {
          qc.invalidateQueries({ queryKey: ["documents"] });
          addToast({ type: "success", message: `"${file.name}" berhasil diunggah` });
          resolve();
        } else {
          let errMsg = "Upload gagal";
          try {
            const parsed = JSON.parse(xhr.responseText);
            errMsg = parsed?.detail ?? errMsg;
          } catch {
            // ignore parse error
          }
          addToast({ type: "error", message: errMsg });
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        setActiveUploads((prev) => prev.filter((u) => u.name !== file.name));
        const errMsg = "Upload gagal — periksa koneksi jaringan";
        addToast({ type: "error", message: errMsg });
        reject(new Error(errMsg));
      };

      xhr.send(formData);
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => uploadWithProgress(f));
  };

  const isUploading = activeUploads.length > 0;

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="text-primary-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Dokumen</h1>
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
            className={`mb-4 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition ${
              dragOver
                ? "border-primary-400 bg-primary-50"
                : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <Upload
              className={`${isUploading ? "animate-bounce text-primary-500" : "text-gray-400"}`}
              size={32}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? "Mengunggah..." : "Drag & drop atau klik untuk upload"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, JPEG — maks. 25 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Active upload progress bars */}
          {activeUploads.length > 0 && (
            <div className="mb-4 space-y-2">
              {activeUploads.map((upload) => (
                <div key={upload.name} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs text-gray-700 truncate max-w-xs">{upload.name}</p>
                    <span className="text-xs text-primary-600 font-medium ml-2">
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
                      aria-label={`Progress upload ${upload.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Document list */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-16 text-center shadow-sm">
              <FileText className="text-gray-300" size={40} />
              <p className="text-gray-400 text-sm">Belum ada dokumen. Upload untuk mulai.</p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition"
              >
                Upload Dokumen Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                >
                  <FileText className="shrink-0 text-gray-400" size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.original_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatBytes(doc.file_size)} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <DocumentStatusBadge status={doc.status} />

                  {/* Reprocess button for failed docs */}
                  {["failed", "needs_review"].includes(doc.status) && (
                    <button
                      onClick={() => reprocessMutation.mutate(doc.id)}
                      disabled={reprocessMutation.isPending}
                      title="Proses ulang"
                      className="rounded-lg p-2 text-blue-400 hover:bg-blue-50 transition"
                      aria-label={`Proses ulang ${doc.original_name}`}
                    >
                      <RefreshCw
                        size={16}
                        className={reprocessMutation.isPending ? "animate-spin" : ""}
                      />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget({ id: doc.id, name: doc.original_name })}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-50 transition"
                    aria-label={`Hapus ${doc.original_name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs text-blue-700">
            <p className="font-medium mb-1">ℹ️ Alur pemrosesan dokumen</p>
            <p>
              Setelah upload, dokumen akan otomatis masuk antrian → diproses (ekstraksi teks +
              embedding) → selesai.
            </p>
            <p className="mt-1">Status diperbarui otomatis setiap beberapa detik.</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Dokumen"
        message={`Yakin ingin menghapus "${deleteTarget?.name ?? ""}"? Dokumen yang sudah dihapus tidak dapat dipulihkan.`}
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
