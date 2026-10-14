import React from "react";

interface Props {
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; animateClass?: string }
> = {
  uploaded: { label: "Diunggah", className: "bg-gray-100 text-gray-600" },
  queued: { label: "Antrian", className: "bg-yellow-100 text-yellow-700", animateClass: "animate-pulse" },
  processing: { label: "Diproses", className: "bg-blue-100 text-blue-700", animateClass: "animate-pulse" },
  completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
  failed: { label: "Gagal", className: "bg-red-100 text-red-700" },
  needs_review: { label: "Perlu Review", className: "bg-orange-100 text-orange-700" },
  deleted: { label: "Dihapus", className: "bg-gray-100 text-gray-400" },
};

export default function DocumentStatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span
      aria-label={config.label}
      className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${config.className} ${
        config.animateClass ?? ""
      }`}
    >
      {config.label}
    </span>
  );
}
