import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { chatApi, documentsApi, getApiError, type SourceCitation, type Document } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import {
  MessageSquare,
  Plus,
  Download,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  Filter,
  Sparkles,
} from "lucide-react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  timestamp?: string;
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const convIdFromUrl = searchParams.get("conv") ?? undefined;
  const [conversationId, setConversationId] = useState<string | undefined>(convIdFromUrl);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fase 4 & 5 Enhancements
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [targetDocId, setTargetDocId] = useState<string>("all");
  const [ragMode, setRagMode] = useState<"strict" | "exploratory">("strict");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // Load available documents for filter
  useEffect(() => {
    documentsApi.list().then((res) => {
      setAvailableDocs(res.items.filter((d) => d.status === "completed"));
    });
  }, []);

  // Sync when URL query changes
  useEffect(() => {
    const currentConv = searchParams.get("conv") ?? undefined;
    setConversationId(currentConv);
    if (currentConv) {
      chatApi
        .getConversation(currentConv)
        .then((conv) => {
          setConversationTitle(conv.title);
          setTempTitle(conv.title);
          setMessages(
            conv.messages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: m.created_at,
              sources: m.sources,
            }))
          );
        })
        .catch(() => {
          setMessages([]);
          setConversationTitle(null);
        });
    } else {
      setMessages([]);
      setConversationTitle(null);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = useCallback(
    async (question: string) => {
      if (sending) return;
      setSending(true);

      const tempId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: tempId, role: "user", content: question, timestamp: new Date().toISOString() },
      ]);

      try {
        const res = await chatApi.sendMessage({
          question,
          conversation_id: conversationId,
          target_document_id: targetDocId !== "all" ? targetDocId : undefined,
          mode: ragMode,
        });
        setConversationId(res.conversation_id);
        setSearchParams({ conv: res.conversation_id });
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: res.answer,
            sources: res.sources,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        addToast({ type: "error", message: getApiError(err) });
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setSending(false);
      }
    },
    [sending, conversationId, targetDocId, ragMode, addToast, setSearchParams]
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setConversationTitle(null);
    setSearchParams({});
  };

  const handleSaveTitle = async () => {
    if (!conversationId || !tempTitle.trim()) return;
    try {
      await chatApi.updateConversationTitle(conversationId, tempTitle.trim());
      setConversationTitle(tempTitle.trim());
      setIsEditingTitle(false);
      addToast({ type: "success", message: "Judul percakapan berhasil diperbarui" });
    } catch (err) {
      addToast({ type: "error", message: getApiError(err) });
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const lines = [
      `# ${conversationTitle ?? "Percakapan AI Chatbot"}`,
      `Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
      "",
      "---",
      "",
    ];

    messages.forEach((m) => {
      lines.push(`### ${m.role === "user" ? "Pengguna" : "Asisten AI"}`);
      lines.push(m.content);
      if (m.sources && m.sources.length > 0) {
        lines.push("");
        lines.push("**Sumber Rujukan:**");
        m.sources.forEach((s) => {
          lines.push(`- ${s.document_name} (Hal. ${s.page ?? 1})`);
        });
      }
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${(conversationTitle || "percakapan").replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({ type: "success", message: "Riwayat chat berhasil diekspor (.md)" });
  };

  return (
    <ProtectedLayout>
      <div className="flex h-full flex-col bg-gray-50">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-3.5 shrink-0 shadow-xs gap-3">
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="rounded-lg border border-primary-500 px-2.5 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full max-w-md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="rounded-lg bg-primary-600 p-1.5 text-white hover:bg-primary-700"
                  title="Simpan judul"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="rounded-lg bg-gray-200 p-1.5 text-gray-700 hover:bg-gray-300"
                  title="Batal"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {conversationTitle ?? (conversationId ? "Percakapan" : "Chat Baru")}
                </h1>
                {conversationId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempTitle(conversationTitle || "");
                      setIsEditingTitle(true);
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Ubah judul percakapan"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            )}
            {conversationId && !isEditingTitle && (
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                ID: {conversationId.slice(0, 8)}...
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export Chat Button */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportChat}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-xs"
                title="Ekspor riwayat percakapan"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Ekspor</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs"
            >
              <Plus size={15} />
              Percakapan Baru
            </button>
          </div>
        </header>

        {/* Sub-header / Agentic RAG Controls */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-2 sm:px-6 text-xs text-gray-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-500 flex items-center gap-1">
              <Filter size={12} /> Sumber Acuan:
            </span>
            <select
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-800 outline-none focus:border-primary-500 shadow-xs font-medium"
            >
              <option value="all">Semua Dokumen ({availableDocs.length})</option>
              {availableDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_name.endsWith(".xlsx") || d.original_name.endsWith(".xls")
                    ? `[Excel] ${d.original_name}`
                    : d.original_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-gray-400 hidden sm:inline">Mode:</span>
            <button
              type="button"
              onClick={() => setRagMode(ragMode === "strict" ? "exploratory" : "strict")}
              className={`rounded-md px-2 py-0.5 font-medium transition ${
                ragMode === "strict"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
              title="Klik untuk ganti mode penalaran RAG"
            >
              {ragMode === "strict" ? "Ketat Dokumen" : "Eksplanatif"}
            </button>
          </div>
        </div>

        {/* Messages Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 shadow-xs">
                <MessageSquare className="text-primary-500" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Mulai percakapan</h2>
                <p className="mt-1 text-sm text-gray-500 max-w-sm">
                  Ajukan pertanyaan seputar dokumen laporan PDF atau lembar spreadsheet Excel Anda.
                </p>
              </div>

              {/* Suggestions */}
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-md w-full">
                {[
                  "Ringkas dokumen ini",
                  "Berapa pendapatan tahun 2024?",
                  "Rekap kinerja anggaran Excel",
                  "Apa rencana ekspansi 2025?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    disabled={sending}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition shadow-xs group"
                  >
                    <Sparkles size={13} className="text-primary-500 shrink-0 group-hover:scale-110 transition" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  timestamp={msg.timestamp}
                />
              ))}
              {sending && <ChatMessage role="assistant" content="" loading />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3.5 sm:px-6 shadow-xs">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSend} disabled={sending} />
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Jawaban digenerasi otomatis berdasarkan basis pengetahuan dokumen & spreadsheet Excel yang diunggah.
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
