import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { chatApi, getApiError, type SourceCitation } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { MessageSquare, Plus } from "lucide-react";

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

  // Sync when URL query changes
  useEffect(() => {
    const currentConv = searchParams.get("conv") ?? undefined;
    setConversationId(currentConv);
    if (currentConv) {
      chatApi
        .getConversation(currentConv)
        .then((conv) => {
          setConversationTitle(conv.title);
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
        const res = await chatApi.sendMessage({ question, conversation_id: conversationId });
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
    [sending, conversationId, addToast, setSearchParams]
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setConversationTitle(null);
    setSearchParams({});
  };

  return (
    <ProtectedLayout>
      <div className="flex h-full flex-col bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {conversationTitle ?? (conversationId ? "Percakapan" : "Chat Baru")}
            </h1>
            {conversationId && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                ID: {conversationId.slice(0, 8)}...
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
          >
            <Plus size={16} />
            Percakapan Baru
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                <MessageSquare className="text-primary-500" size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Mulai percakapan</h2>
                <p className="mt-1 text-sm text-gray-400 max-w-sm">
                  Upload dokumen terlebih dahulu, lalu ajukan pertanyaan seputar isinya.
                </p>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-md w-full">
                {[
                  "Ringkas dokumen ini",
                  "Daftar fakta penting",
                  "Apa yang perlu saya ketahui?",
                  "Jelaskan bagian ini",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    disabled={sending}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-gray-50 hover:border-primary-300 transition shadow-sm"
                  >
                    {suggestion}
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

        {/* Input */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSend} disabled={sending} />
            <p className="mt-2 text-center text-xs text-gray-400">
              Jawaban berdasarkan dokumen yang Anda unggah.
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
