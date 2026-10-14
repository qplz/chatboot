import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | AI Chatbot",
  description: "Chat dengan AI berdasarkan dokumen Anda",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
