export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface SourceCitation {
  document_id: string;
  document_name: string;
  page?: number;
  chunk_id?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: SourceCitation[];
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  document_name: string;
  page: number;
  text: string;
}

export interface Document {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  status: "uploaded" | "queued" | "processing" | "completed" | "failed" | "needs_review" | "deleted";
  checksum?: string;
  created_at: string;
  updated_at: string;
  chunks?: DocumentChunk[];
}

export interface ChatRequest {
  question: string;
  conversation_id?: string;
  target_document_id?: string;
  mode?: "strict" | "exploratory";
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  sources: SourceCitation[];
  status: string;
}
