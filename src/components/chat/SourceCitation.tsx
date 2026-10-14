import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export interface Source {
  document_id: string;
  document_name: string;
  page?: number;
}

interface Props {
  document_name: string;
  page?: number;
}

export default function SourceCitation({ document_name, page }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
      <FileText size={11} aria-hidden="true" />
      <span className="truncate max-w-[160px]" title={document_name}>
        {document_name}
      </span>
      {page !== undefined && <span className="text-blue-400">hal. {page}</span>}
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
