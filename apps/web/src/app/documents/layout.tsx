import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumen | AI Chatbot",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
