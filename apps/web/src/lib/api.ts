import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Types
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

export interface ChatRequest {
  question: string;
  conversation_id?: string;
}

export interface SourceCitation {
  document_id: string;
  document_name: string;
  page?: number;
  chunk_id?: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  sources: SourceCitation[];
  status: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

export interface Document {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>("/api/v1/auth/login", { email, password });
    return res.data;
  },
  logout: async () => {
    await apiClient.post("/api/v1/auth/logout");
  },
  me: async (): Promise<User> => {
    const res = await apiClient.get<User>("/api/v1/auth/me");
    return res.data;
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    const res = await apiClient.post<ChatResponse>("/api/v1/chat", req);
    return res.data;
  },
  listConversations: async (): Promise<{ items: Conversation[]; total: number }> => {
    const res = await apiClient.get("/api/v1/conversations");
    return res.data;
  },
  getConversation: async (id: string): Promise<ConversationDetail> => {
    const res = await apiClient.get<ConversationDetail>(`/api/v1/conversations/${id}`);
    return res.data;
  },
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/conversations/${id}`);
  },
};

// Documents API
export const documentsApi = {
  upload: async (file: File): Promise<{ id: string; original_name: string; status: string; message: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post("/api/v1/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  list: async (): Promise<{ items: Document[]; total: number }> => {
    const res = await apiClient.get("/api/v1/documents");
    return res.data;
  },
  get: async (id: string): Promise<Document> => {
    const res = await apiClient.get<Document>(`/api/v1/documents/${id}`);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/documents/${id}`);
  },
};

export function getApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.detail || err.message;
  }
  return "An unexpected error occurred";
}
