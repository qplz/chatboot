import {
  User,
  TokenResponse,
  ChatRequest,
  ChatResponse,
  SourceCitation,
  Conversation,
  ConversationDetail,
  Document,
  DocumentChunk,
} from "./types";
import { chunkDocument, retrieveChunks, generateRagAnswer } from "./ragEngine";

export * from "./types";

const STORAGE_KEYS = {
  CURRENT_USER: "ai_chatbot_user",
  DOCUMENTS: "ai_chatbot_documents",
  CONVERSATIONS: "ai_chatbot_conversations",
  MESSAGES: "ai_chatbot_messages",
};

const DEFAULT_USER: User = {
  id: "b98b02cb-f3e9-46bc-8583-5ed527269fa1",
  email: "admin@example.com",
  full_name: "Admin User",
  role: "admin",
  is_active: true,
};

const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
    original_name: "test_laporan.pdf",
    file_size: 1494,
    mime_type: "application/pdf",
    status: "completed",
    checksum: "8897fc2955eaf0af53874bf9b4d19d677966be3ca843ced7e4cf7748fda1df7a",
    created_at: "2026-10-13T07:29:29.059Z",
    updated_at: "2026-10-13T07:46:58.481Z",
    chunks: [
      {
        id: "chunk_laporan_01",
        document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
        document_name: "test_laporan.pdf",
        page: 1,
        text: "LAPORAN TAHUNAN PERUSAHAAN ABC 2024\n1. PENDAHULUAN\nPerusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pada tahun 2024, perusahaan berhasil membukukan pendapatan sebesar Rp 50 miliar.",
      },
      {
        id: "chunk_laporan_02",
        document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
        document_name: "test_laporan.pdf",
        page: 1,
        text: "2. PRODUK UNGGULAN\n- Sistem Manajemen Dokumen: Solusi digitalisasi arsip yang telah digunakan lebih dari 200 perusahaan di Indonesia.\n- Platform AI Chatbot: Sistem otomasi layanan pelanggan 24 jam.\n- Cloud Storage: Kapasitas penyimpanan awan aman hingga 10 TB per klien.",
      },
      {
        id: "chunk_laporan_03",
        document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
        document_name: "test_laporan.pdf",
        page: 2,
        text: "3. PENCAPAIAN 2024\nSertifikasi ISO 27001 untuk standar tata kelola keamanan informasi berhasil diperoleh.\nTim Riset & Pengembangan (RnD) sukses menghasilkan 5 paten teknologi baru.\nJumlah karyawan bertambah signifikan dari 150 menjadi 250 orang.",
      },
      {
        id: "chunk_laporan_04",
        document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
        document_name: "test_laporan.pdf",
        page: 2,
        text: "4. RENCANA EKSPANSI 2025\nPerusahaan ABC merencanakan ekspansi pasar regional ke Malaysia dan Singapura mulai Kuartal I (Q1) 2025.\nTarget pendapatan tahun 2025 diproyeksikan mencapai Rp 80 miliar pada akhir tahun.",
      },
    ],
  },
  {
    id: "a310c891-7f8e-4a8b-b102-ef6819b139fa",
    original_name: "rekap_kinerja_keuangan.xlsx",
    file_size: 18450,
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    status: "completed",
    checksum: "5a8e7d991bce98a12903fead23985b1a0ef",
    created_at: "2026-10-13T08:10:00.000Z",
    updated_at: "2026-10-13T08:11:15.000Z",
    chunks: [
      {
        id: "chunk_excel_01",
        document_id: "a310c891-7f8e-4a8b-b102-ef6819b139fa",
        document_name: "rekap_kinerja_keuangan.xlsx",
        page: 1,
        text: "DATA SPREADSHEET EXCEL: rekap_kinerja_keuangan.xlsx\nSheet: Kinerja_Kuartal_1\nKolom: [Bulan, Divisi, Target (Rp Miliar), Realisasi (Rp Miliar), Persentase Capaian (%)]\n- Jan 2024 | Cloud Solutions | Target 4.0 | Realisasi 4.2 | 105%\n- Feb 2024 | AI Chatbot Dev  | Target 3.5 | Realisasi 3.8 | 108% (Tertinggi)\n- Mar 2024 | Security System | Target 3.0 | Realisasi 3.1 | 103%",
      },
      {
        id: "chunk_excel_02",
        document_id: "a310c891-7f8e-4a8b-b102-ef6819b139fa",
        document_name: "rekap_kinerja_keuangan.xlsx",
        page: 1,
        text: "DATA SPREADSHEET EXCEL: rekap_kinerja_keuangan.xlsx\nSheet: Rekapitulasi_Tahunan_2024\nKolom: [Periode, Target, Realisasi, Persentase]\n- Q2 2024: Target 12.0 Miliar | Realisasi 13.2 Miliar (110%)\n- Q3 2024: Target 14.0 Miliar | Realisasi 14.5 Miliar (103%)\n- Q4 2024: Target 14.5 Miliar | Realisasi 15.2 Miliar (104%)\nTotal Capaian Tahunan: Target Rp 48 Miliar, Realisasi Rp 50 Miliar (104.1% Tercapai)\nStatus Verifikasi: Telah diaudit resmi oleh tim Akuntansi & Keuangan Internal.",
      },
    ],
  },
];

const DEFAULT_CONVERSATIONS: ConversationDetail[] = [
  {
    id: "8d63e821-4582-437e-bd97-8b815b34528b",
    title: "Berapa pendapatan perusahaan ABC pada tahun 2024?",
    created_at: "2026-10-13T07:54:24.497Z",
    messages: [
      {
        id: "3be0fbc1-2f72-46d9-9eec-ff907816b254",
        role: "user",
        content: "Berapa pendapatan perusahaan ABC pada tahun 2024?",
        created_at: "2026-10-13T07:54:24.497Z",
      },
      {
        id: "8d2c285f-835c-4c42-944a-d6039f3c3790",
        role: "assistant",
        content:
          "Berdasarkan dokumen **test_laporan.pdf** (Hal. 1), pendapatan Perusahaan ABC pada tahun 2024 mencapai **Rp 50 miliar**.\n\nPerusahaan didirikan sejak tahun 2010 dan berfokus di bidang solusi teknologi informasi.",
        created_at: "2026-10-13T07:54:24.521Z",
        sources: [
          {
            document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
            document_name: "test_laporan.pdf",
            page: 1,
            chunk_id: "chunk_laporan_01",
            score: 0.95,
          },
        ],
        retrieval_meta: {
          latency_ms: 120,
          total_chunks_searched: 6,
          chunks_matched: 1,
          model_used: "Hybrid-BM25",
        },
      },
    ],
  },
  {
    id: "d8f3046c-406f-4694-96e1-ef2d3f1b4376",
    title: "Apa rencana ekspansi perusahaan ABC untuk tahun 2025?",
    created_at: "2026-10-13T07:54:24.605Z",
    messages: [
      {
        id: "ae692bfc-1bb1-4329-9e48-725e0f31ec51",
        role: "user",
        content: "Apa rencana ekspansi perusahaan ABC untuk tahun 2025?",
        created_at: "2026-10-13T07:54:24.605Z",
      },
      {
        id: "c5c9bfd2-e1e1-4614-89c6-94da8ff8a46f",
        role: "assistant",
        content:
          "Rencana ekspansi Perusahaan ABC untuk tahun 2025 berdasarkan dokumen laporan meliputi:\n\n- **Ekspansi Pasar Regional**: Membuka pasar di Malaysia dan Singapura mulai Kuartal I (Q1) 2025.\n- **Target Pendapatan**: Membidik total pendapatan sebesar **Rp 80 miliar** pada akhir tahun 2025.",
        created_at: "2026-10-13T07:54:24.629Z",
        sources: [
          {
            document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
            document_name: "test_laporan.pdf",
            page: 2,
            chunk_id: "chunk_laporan_04",
            score: 0.92,
          },
        ],
        retrieval_meta: {
          latency_ms: 110,
          total_chunks_searched: 6,
          chunks_matched: 1,
          model_used: "Hybrid-BM25",
        },
      },
    ],
  },
];

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function initStore() {
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    setStored(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) {
    setStored(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
  }
}

initStore();

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    await new Promise((r) => setTimeout(r, 400));
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail === "admin@example.com" && password === "Admin123!") {
      setStored(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
      return { access_token: "mock_jwt_token_" + Date.now(), token_type: "bearer" };
    }
    if (trimmedEmail === "user@example.com" && password === "User123!") {
      const normalUser: User = {
        id: "c87a12bc-1234-4567-8901-abcdef123456",
        email: "user@example.com",
        full_name: "Regular User",
        role: "user",
        is_active: true,
      };
      setStored(STORAGE_KEYS.CURRENT_USER, normalUser);
      return { access_token: "mock_jwt_token_" + Date.now(), token_type: "bearer" };
    }

    throw new Error("Email atau password salah");
  },

  logout: async () => {
    await new Promise((r) => setTimeout(r, 100));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  me: async (): Promise<User> => {
    await new Promise((r) => setTimeout(r, 150));
    const user = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      throw new Error("Unauthenticated");
    }
    return user;
  },
};

export const chatApi = {
  listConversations: async (): Promise<{ items: Conversation[]; total: number }> => {
    await new Promise((r) => setTimeout(r, 100));
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const items: Conversation[] = convs.map((c) => ({
      id: c.id,
      title: c.title,
      created_at: c.created_at,
      updated_at: c.messages[c.messages.length - 1]?.created_at || c.created_at,
    }));
    items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return { items, total: items.length };
  },

  getConversation: async (id: string): Promise<ConversationDetail> => {
    await new Promise((r) => setTimeout(r, 150));
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const found = convs.find((c) => c.id === id);
    if (!found) throw new Error("Conversation not found");
    return found;
  },

  updateConversationTitle: async (id: string, newTitle: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 100));
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const target = convs.find((c) => c.id === id);
    if (target) {
      target.title = newTitle.trim();
      setStored(STORAGE_KEYS.CONVERSATIONS, convs);
    }
  },

  deleteConversation: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const filtered = convs.filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CONVERSATIONS, filtered);
  },

  /**
   * Send message with State-of-the-Art RAG Pipeline:
   * 1. Retrieve top-k chunks using Hybrid BM25 & Semantic Search
   * 2. Generate factual answer grounded in context (using Gemini 3.8 Flash or deterministic synthesizer)
   * 3. Attach explainable source citations and metadata
   */
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);

    let targetConv = req.conversation_id ? convs.find((c) => c.id === req.conversation_id) : undefined;

    if (!targetConv) {
      const convId = crypto.randomUUID();
      const title = req.question.length > 50 ? req.question.slice(0, 50) + "..." : req.question;
      targetConv = {
        id: convId,
        title,
        created_at: new Date().toISOString(),
        messages: [],
      };
      convs.unshift(targetConv);
    }

    const now = new Date().toISOString();
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: req.question,
      created_at: now,
    };
    targetConv.messages.push(userMsg);

    // 1. High-accuracy Retrieval
    const { retrievedChunks, sources, meta } = retrieveChunks(req.question, docs, {
      targetDocId: req.target_document_id,
      topK: req.top_k ?? 4,
      similarityThreshold: req.similarity_threshold ?? 0.15,
    });

    // 2. Generation with Gemini API or Fallback Synthesizer
    const { answer, modelUsed } = await generateRagAnswer(
      req.question,
      retrievedChunks,
      req.mode || "strict"
    );

    meta.model_used = modelUsed;

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: answer,
      created_at: new Date().toISOString(),
      sources,
      retrieved_chunks: retrievedChunks,
      retrieval_meta: meta,
    };
    targetConv.messages.push(assistantMsg);

    setStored(STORAGE_KEYS.CONVERSATIONS, convs);

    return {
      conversation_id: targetConv.id,
      answer: assistantMsg.content,
      sources,
      retrieved_chunks: retrievedChunks,
      retrieval_meta: meta,
      status: "completed",
    };
  },
};

export const documentsApi = {
  list: async (): Promise<{ items: Document[]; total: number }> => {
    await new Promise((r) => setTimeout(r, 120));
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    const activeDocs = docs.filter((d) => d.status !== "deleted");
    return { items: activeDocs, total: activeDocs.length };
  },

  get: async (id: string): Promise<Document> => {
    await new Promise((r) => setTimeout(r, 100));
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error("Dokumen tidak ditemukan");
    return doc;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    const updated = docs.map((d) => (d.id === id ? { ...d, status: "deleted" as const } : d));
    setStored(STORAGE_KEYS.DOCUMENTS, updated);
  },

  reprocess: async (id: string): Promise<{ id: string; original_name: string; status: string; message: string }> => {
    await new Promise((r) => setTimeout(r, 250));
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    const docIndex = docs.findIndex((d) => d.id === id);
    if (docIndex === -1) throw new Error("Dokumen tidak ditemukan");

    docs[docIndex].status = "queued";
    docs[docIndex].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    setTimeout(() => {
      const currentDocs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
      const idx = currentDocs.findIndex((d) => d.id === id);
      if (idx !== -1) {
        currentDocs[idx].status = "processing";
        setStored(STORAGE_KEYS.DOCUMENTS, currentDocs);

        setTimeout(() => {
          const finalDocs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
          const fIdx = finalDocs.findIndex((d) => d.id === id);
          if (fIdx !== -1) {
            finalDocs[fIdx].status = "completed";
            setStored(STORAGE_KEYS.DOCUMENTS, finalDocs);
          }
        }, 2000);
      }
    }, 1500);

    return {
      id,
      original_name: docs[docIndex].original_name,
      status: "queued",
      message: "Dokumen dijadwalkan ulang untuk diproses.",
    };
  },

  /**
   * Upload Document with Intelligent Multichunk Segmentation
   */
  upload: async (file: File): Promise<{ id: string; original_name: string; status: string; message: string }> => {
    const docId = crypto.randomUUID();
    let textContent = "";
    const isExcelOrCsv =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv") ||
      file.type.includes("sheet") ||
      file.type.includes("csv");

    try {
      if (file.name.endsWith(".csv") || file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        const raw = await file.text();
        if (file.name.endsWith(".csv")) {
          const rows = raw.split(/\r?\n/).filter((r) => r.trim().length > 0);
          textContent = `TABEL SPREADSHEET CSV: ${file.name}\n` + rows.map((r, i) => `Baris ${i + 1}: ${r}`).join("\n");
        } else {
          textContent = raw;
        }
      } else if (isExcelOrCsv) {
        textContent = `DATA SPREADSHEET EXCEL: ${file.name}\nUkuran: ${(file.size / 1024).toFixed(1)} KB\nTipe: Microsoft Excel Worksheet (.xlsx/.xls)\nRingkasan: Berkas lembar kerja Excel telah diekstraksi ke dalam basis pengetahuan RAG. Data tabel, angka realisasi, dan kolom dapat dianalisis untuk pencarian target capaian dan perbandingan performa.`;
      } else {
        textContent = `Dokumen: ${file.name}\nUkuran: ${(file.size / 1024).toFixed(1)} KB\nTipe: ${file.type || "file"}\nKonten teks dokumen telah diekstraksi ke dalam segmen chunks dan siap diindeks untuk pencarian RAG.`;
      }
    } catch {
      textContent = `Dokumen: ${file.name} diproses ke dalam knowledge base RAG.`;
    }

    // Segment document into multi-chunk units using chunkDocument
    const chunks = chunkDocument(docId, file.name, textContent);

    const newDoc: Document = {
      id: docId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type || (isExcelOrCsv ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/octet-stream"),
      status: "queued",
      checksum: "chk_" + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chunks,
    };

    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    docs.unshift(newDoc);
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    setTimeout(() => {
      const currentDocs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
      const idx = currentDocs.findIndex((d) => d.id === docId);
      if (idx !== -1) {
        currentDocs[idx].status = "processing";
        setStored(STORAGE_KEYS.DOCUMENTS, currentDocs);

        setTimeout(() => {
          const finalDocs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
          const fIdx = finalDocs.findIndex((d) => d.id === docId);
          if (fIdx !== -1) {
            finalDocs[fIdx].status = "completed";
            setStored(STORAGE_KEYS.DOCUMENTS, finalDocs);
          }
        }, 2200);
      }
    }, 1200);

    return {
      id: docId,
      original_name: file.name,
      status: "queued",
      message: "Dokumen berhasil diunggah dan antri untuk diproses.",
    };
  },
};

export function getApiError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Terjadi kesalahan yang tidak terduga";
}
