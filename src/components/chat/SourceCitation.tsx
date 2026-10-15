import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { SourceCitation as SourceType } from "@/lib/types";

export type Source = SourceType;

interface Props {
  document_name: string;
  page?: number;
  score?: number;
}

export default function SourceCitation({ document_name, page, score }: Props) {
  const isExcel =
    document_name.endsWith(".xlsx") ||
    document_name.endsWith(".xls") ||
    document_name.endsWith(".csv");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition ${
        isExcel
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-blue-50 text-blue-800 border-blue-200"
      }`}
    >
      {isExcel ? (
        <FileSpreadsheet size={12} className="text-emerald-600" aria-hidden="true" />
      ) : (
        <FileText size={12} className="text-blue-600" aria-hidden="true" />
      )}
      <span className="truncate max-w-[150px] font-semibold" title={document_name}>
        {document_name}
      </span>
      {page !== undefined && (
        <span className="text-[11px] opacity-75">
          {isExcel ? `Sheet ${page}` : `Hal. ${page}`}
        </span>
      )}
      {score !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            score >= 0.8
              ? "bg-emerald-100 text-emerald-700"
              : score >= 0.5
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
          title={`Tingkat relevansi RAG: ${Math.round(score * 100)}%`}
        >
          {Math.round(score * 100)}%
        </span>
      )}
    </span>
  );
}

export function SourceCitationList({
  sources,
  collapsible,
}: {
  sources: Source[];
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const showAll = !collapsible || sources.length <= 2 || expanded;
  const visible = showAll ? sources : sources.slice(0, 2);
  const hidden = sources.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((s, idx) => (
        <SourceCitation
          key={s.document_id + "_" + (s.page ?? 0) + "_" + idx}
          document_name={s.document_name}
          page={s.page}
          score={s.score}
        />
      ))}
      {collapsible && sources.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 transition"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp size={11} aria-hidden="true" />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown size={11} aria-hidden="true" />
              Lihat {hidden} sumber lainnya
            </>
          )}
        </button>
      )}
    </div>
  );
}
