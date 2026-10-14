"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { chatApi, getApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { MessageSquare, Plus } from "lucide-react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document_id: string; document_name: string; page?: number }[];
  timestamp?: string;
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    searchParams.get("conv") ?? undefined
  );
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load existing conversation from URL param
  const { data: existingConv } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId && messages.length === 0,
  });

  useEffect(() => {
    if (existingConv?.messages) {
      setMessages(
        existingConv.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.created_at,
        }))
      );
    }
  }, [existingConv]);

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
        // Update URL without reload
        window.history.pushState({}, "", `/chat?conv=${res.conversation_id}`);
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
    [sending, conversationId, addToast]
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    window.history.replaceState({}, "", "/chat");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {existingConv?.title ?? "Chat Baru"}
          </h1>
          {conversationId && (
            <p className="text-xs text-gray-400 font-mono">
              {conversationId.slice(0, 8)}...
            </p>
          )}
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
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
                  onClick={() => handleSend(suggestion)}
                  disabled={sending}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-gray-50 hover:border-primary-300 transition"
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
      <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={sending} />
          <p className="mt-2 text-center text-xs text-gray-400">
            Jawaban berdasarkan dokumen yang Anda unggah.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedLayout>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-gray-400">
            Memuat...
          </div>
        }
      >
        <ChatPageContent />
      </Suspense>
    </ProtectedLayout>
  );
}
