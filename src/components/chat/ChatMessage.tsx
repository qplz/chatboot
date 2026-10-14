import React, { useState } from "react";
import { Bot, Copy, Check, User } from "lucide-react";
import { SourceCitationList, Source } from "./SourceCitation";
import RelativeTime from "@/components/ui/RelativeTime";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
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

    // flush remaining
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

export default function ChatMessage({ role, content, sources, loading, timestamp }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary-600 shadow-sm" : "bg-gray-200"
        }`}
      >
        {isUser ? (
          <User className="text-white" size={16} aria-hidden="true" />
        ) : (
          <Bot className="text-gray-600" size={16} aria-hidden="true" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`group relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary-600 text-white rounded-tr-sm shadow-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5 py-1" aria-label="Sedang mengetik">
              <span
                className="inline-block h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          ) : (
            <div className="whitespace-pre-wrap">{renderMarkdown(content)}</div>
          )}

          {/* Copy button — assistant only, visible on hover */}
          {!isUser && !loading && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Disalin!" : "Salin pesan"}
              className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-white border border-gray-200 p-1 shadow-sm hover:bg-gray-50 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {copied ? (
                <Check size={13} className="text-green-600" aria-hidden="true" />
              ) : (
                <Copy size={13} className="text-gray-500" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <RelativeTime date={timestamp} className="text-xs text-gray-400 mt-1" />
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="mt-1">
            <SourceCitationList sources={sources} collapsible={sources.length > 2} />
          </div>
        )}
      </div>
    </div>
  );
}
