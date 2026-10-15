import React, { useState } from "react";
import { Bot, Copy, Check, User, Sparkles, ChevronDown, ChevronUp, Layers, Clock, Cpu } from "lucide-react";
import { SourceCitationList, Source } from "./SourceCitation";
import RelativeTime from "@/components/ui/RelativeTime";
import { RetrievedChunkContext, RetrievalMeta } from "@/lib/types";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  retrieved_chunks?: RetrievedChunkContext[];
  retrieval_meta?: RetrievalMeta;
  loading?: boolean;
  timestamp?: string;
}

function applyBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderInlineLines(lines: string[], key: string): React.ReactNode {
  return (
    <p key={key}>
      {lines.map((line, i) => (
        <span key={i}>
          {applyBold(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para, pIdx) => {
    const lines = para.split("\n");
    const listItems: string[] = [];
    const nonListLines: string[] = [];
    const blocks: React.ReactNode[] = [];

    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^[-*] /.test(line)) {
        if (!inList && nonListLines.length > 0) {
          blocks.push(renderInlineLines(nonListLines, `${pIdx}-p-${i}`));
          nonListLines.length = 0;
        }
        inList = true;
        listItems.push(line.replace(/^[-*] /, ""));
      } else {
        if (inList && listItems.length > 0) {
          blocks.push(
            <ul key={`${pIdx}-ul-${i}`} className="list-disc pl-5 space-y-0.5">
              {listItems.map((item, li) => (
                <li key={li}>{applyBold(item)}</li>
              ))}
            </ul>
          );
          listItems.length = 0;
          inList = false;
        }
        nonListLines.push(line);
      }
    }

    if (inList && listItems.length > 0) {
      blocks.push(
        <ul key={`${pIdx}-ul-end`} className="list-disc pl-5 space-y-0.5">
          {listItems.map((item, li) => (
            <li key={li}>{applyBold(item)}</li>
          ))}
        </ul>
      );
    }
    if (nonListLines.length > 0) {
      blocks.push(renderInlineLines(nonListLines, `${pIdx}-p-end`));
    }

    return (
      <div key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
        {blocks}
      </div>
    );
  });
}

export default function ChatMessage({
  role,
  content,
  sources,
  retrieved_chunks,
  retrieval_meta,
  loading,
  timestamp,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showRagInsight, setShowRagInsight] = useState(false);
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasChunks = retrieved_chunks && retrieved_chunks.length > 0;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary-600 shadow-xs" : "bg-primary-50 text-primary-600 border border-primary-200"
        }`}
      >
        {isUser ? (
          <User className="text-white" size={16} aria-hidden="true" />
        ) : (
          <Bot className="text-primary-600" size={16} aria-hidden="true" />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`group relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary-600 text-white rounded-tr-xs shadow-xs"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-xs shadow-xs"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5 py-1" aria-label="Sedang memproses RAG">
              <span
                className="inline-block h-2 w-2 rounded-full bg-primary-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block h-2 w-2 rounded-full bg-primary-500 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block h-2 w-2 rounded-full bg-primary-600 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          ) : (
            <div className="whitespace-pre-wrap">{renderMarkdown(content)}</div>
          )}

          {/* Copy button */}
          {!isUser && !loading && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Disalin!" : "Salin pesan"}
              className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-white border border-gray-200 p-1 shadow-xs hover:bg-gray-50 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {copied ? (
                <Check size={13} className="text-green-600" aria-hidden="true" />
              ) : (
                <Copy size={13} className="text-gray-500" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Footer Meta: Timestamp, Citations & RAG Explainability Toggle */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {timestamp && (
            <RelativeTime date={timestamp} className="text-[11px] text-gray-400" />
          )}

          {!isUser && !loading && (hasChunks || retrieval_meta) && (
            <button
              type="button"
              onClick={() => setShowRagInsight((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 transition"
            >
              <Sparkles size={11} className="text-primary-600" />
              <span>Insight RAG</span>
              {showRagInsight ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>

        {/* Sources List */}
        {sources && sources.length > 0 && (
          <div className="mt-1">
            <SourceCitationList sources={sources} collapsible={sources.length > 2} />
          </div>
        )}

        {/* RAG Explainability Dropdown Card */}
        {showRagInsight && !isUser && (
          <div className="mt-2 w-full rounded-xl border border-primary-200 bg-primary-50/40 p-3.5 text-xs text-gray-800 shadow-xs animate-fade-in-up">
            <div className="mb-2.5 flex items-center justify-between border-b border-primary-100 pb-2">
              <span className="font-semibold text-primary-900 flex items-center gap-1.5">
                <Layers size={13} className="text-primary-600" /> Metadata Retrieval RAG
              </span>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                {retrieval_meta?.model_used && (
                  <span className="flex items-center gap-1">
                    <Cpu size={12} className="text-primary-600" /> {retrieval_meta.model_used}
                  </span>
                )}
                {retrieval_meta?.latency_ms !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {retrieval_meta.latency_ms}ms
                  </span>
                )}
              </div>
            </div>

            {hasChunks ? (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-600 font-medium">
                  {retrieved_chunks!.length} segmen (chunk) berbobot relevansi tertinggi yang dipasok ke LLM:
                </p>
                {retrieved_chunks!.map((chunk, i) => (
                  <div
                    key={chunk.id || i}
                    className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs font-mono text-[11px]"
                  >
                    <div className="mb-1 flex items-center justify-between text-gray-500 font-sans text-[11px]">
                      <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                        #{i + 1} {chunk.document_name} (Hal/Sheet {chunk.page})
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                        {Math.round(chunk.score * 100)}% Relevan
                      </span>
                    </div>
                    <p className="line-clamp-3 text-gray-700 whitespace-pre-wrap">{chunk.text}</p>
                    {chunk.matched_terms && chunk.matched_terms.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 font-sans text-[10px] text-gray-400">
                        <span>Kata kunci:</span>
                        {chunk.matched_terms.map((t, idx) => (
                          <span key={idx} className="rounded bg-gray-100 px-1 py-0.2 text-gray-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-[11px]">
                Pertanyaan dijawab berdasarkan penalaran semantik langsung atau indeks guardrail RAG.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
