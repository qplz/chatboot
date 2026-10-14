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

const SAMPLE_DOCUMENT_TEXT = `LAPORAN TAHUNAN PERUSAHAAN ABC 2024
1. PENDAHULUAN
Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi. Pendapatan 2024 mencapai Rp 50 miliar.

2. PRODUK UNGGULAN
- Sistem Manajemen Dokumen digunakan 200 perusahaan di Indonesia.
- Platform AI Chatbot untuk customer service 24 jam.
- Cloud Storage kapasitas hingga 10 TB per klien.

3. PENCAPAIAN 2024
Sertifikasi ISO 27001 untuk keamanan informasi berhasil diperoleh.
Tim RnD menghasilkan 5 paten teknologi baru.
Karyawan meningkat dari 150 menjadi 250 orang.

4. RENCANA 2025
Ekspansi ke Malaysia dan Singapura mulai Q1 2025.
Target pendapatan Rp 80 miliar pada akhir 2025.`;

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
        id: "0f79c58f-1f56-4b33-a3ea-c103ac0a05d1",
        document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
        document_name: "test_laporan.pdf",
        page: 1,
        text: SAMPLE_DOCUMENT_TEXT,
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
          "Berdasarkan dokumen **test_laporan.pdf**, pendapatan Perusahaan ABC pada tahun 2024 mencapai **Rp 50 miliar**.\n\nPerusahaan didirikan sejak tahun 2010 dan berfokus di bidang teknologi informasi.",
        created_at: "2026-10-13T07:54:24.521Z",
        sources: [
          {
            document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
            document_name: "test_laporan.pdf",
            page: 1,
            chunk_id: "0f79c58f-1f56-4b33-a3ea-c103ac0a05d1",
          },
        ],
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
          "Rencana ekspansi Perusahaan ABC untuk tahun 2025 adalah:\n\n- **Ekspansi Regional**: Ekspansi pasar ke Malaysia dan Singapura mulai Q1 2025.\n- **Target Finansial**: Membidik total pendapatan hingga **Rp 80 miliar** pada akhir tahun 2025.",
        created_at: "2026-10-13T07:54:24.629Z",
        sources: [
          {
            document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
            document_name: "test_laporan.pdf",
            page: 1,
            chunk_id: "0f79c58f-1f56-4b33-a3ea-c103ac0a05d1",
          },
        ],
      },
    ],
  },
  {
    id: "da3ecdfc-b340-4f60-87e1-145b586bbb2e",
    title: "Berapa jumlah karyawan perusahaan ABC?",
    created_at: "2026-10-13T07:54:24.700Z",
    messages: [
      {
        id: "c95eb452-0e3c-40b5-a025-6e14a6e9140c",
        role: "user",
        content: "Berapa jumlah karyawan perusahaan ABC?",
        created_at: "2026-10-13T07:54:24.700Z",
      },
      {
        id: "28bb08e9-68ce-46d8-a083-2ddbbb6437e0",
        role: "assistant",
        content:
          "Berdasarkan laporan tahunan 2024, jumlah karyawan Perusahaan ABC mengalami pertumbuhan signifikan dari **150 menjadi 250 orang**.",
        created_at: "2026-10-13T07:54:24.717Z",
        sources: [
          {
            document_id: "24e2bebe-bd39-464d-88e1-c78cef446c30",
            document_name: "test_laporan.pdf",
            page: 1,
            chunk_id: "0f79c58f-1f56-4b33-a3ea-c103ac0a05d1",
          },
        ],
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

// Ensure initial state
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
    // Also allow demo user
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

// RAG matching logic
function ragAnswer(question: string, docs: Document[]): { answer: string; sources: SourceCitation[] } {
  const qLower = question.toLowerCase();

  // Find all active completed documents
  const completedDocs = docs.filter((d) => d.status === "completed" && d.chunks && d.chunks.length > 0);
  if (completedDocs.length === 0) {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.",
      sources: [],
    };
  }

  // Keywords search across chunks
  const matchedChunks: { chunk: DocumentChunk; score: number }[] = [];
  const words = qLower.split(/[\s,?.!]+/).filter((w) => w.length > 2);

  for (const doc of completedDocs) {
    for (const chunk of doc.chunks || []) {
      const chunkLower = chunk.text.toLowerCase();
      let matchCount = 0;
      for (const w of words) {
        if (chunkLower.includes(w)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        matchedChunks.push({ chunk, score: matchCount });
      }
    }
  }

  // If no specific match, check general summary queries
  const isSummaryQuery =
    qLower.includes("ringkas") ||
    qLower.includes("fakta penting") ||
    qLower.includes("apa isi") ||
    qLower.includes("isi dokumen") ||
    qLower.includes("apa yang perlu") ||
    qLower.includes("jelaskan");

  if (matchedChunks.length === 0 && !isSummaryQuery) {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.",
      sources: [],
    };
  }

  const primaryDoc = completedDocs[0];
  const primaryChunk = matchedChunks.length > 0 ? matchedChunks[0].chunk : primaryDoc.chunks![0];
  const sources: SourceCitation[] = [
    {
      document_id: primaryDoc.id,
      document_name: primaryDoc.original_name,
      page: primaryChunk.page || 1,
      chunk_id: primaryChunk.id,
    },
  ];

  // Specific query synthesis based on standard sample data:
  if (qLower.includes("pendapatan") || qLower.includes("omzet") || qLower.includes("uang") || qLower.includes("revenue")) {
    return {
      answer: `Berdasarkan dokumen **${primaryDoc.original_name}**:\n\n- **Pendapatan 2024**: Mencapai **Rp 50 miliar**.\n- **Target Pendapatan 2025**: Ditargetkan mencapai **Rp 80 miliar** pada akhir tahun 2025 seiring ekspansi ke Malaysia dan Singapura.`,
      sources,
    };
  }

  if (qLower.includes("ekspansi") || qLower.includes("2025") || qLower.includes("rencana")) {
    return {
      answer: `Berdasarkan bagian Rencana 2025 pada dokumen **${primaryDoc.original_name}**:\n\n1. **Ekspansi Regional**: Membuka operasional pasar di Malaysia dan Singapura mulai Q1 2025.\n2. **Target Finansial**: Mencapai target pendapatan sebesar **Rp 80 miliar** pada akhir 2025.`,
      sources,
    };
  }

  if (qLower.includes("karyawan") || qLower.includes("pegawai") || qLower.includes("orang") || qLower.includes("staf")) {
    return {
      answer: `Berdasarkan pencapaian tahun 2024, jumlah karyawan Perusahaan ABC mengalami lonjakan signifikan dari **150 orang menjadi 250 orang**.`,
      sources,
    };
  }

  if (qLower.includes("produk") || qLower.includes("layanan") || qLower.includes("ungulan") || qLower.includes("unggulan")) {
    return {
      answer: `Produk unggulan Perusahaan ABC berdasarkan dokumen meliputi:\n\n- **Sistem Manajemen Dokumen**: Telah dipercaya dan digunakan oleh lebih dari 200 perusahaan di Indonesia.\n- **Platform AI Chatbot**: Solusi layanan pelanggan otomatis (customer service) 24 jam non-stop.\n- **Cloud Storage**: Kapasitas penyimpanan awan hingga 10 TB untuk setiap klien.`,
      sources,
    };
  }

  if (qLower.includes("iso") || qLower.includes("sertifikasi") || qLower.includes("keamanan") || qLower.includes("paten")) {
    return {
      answer: `Pencapaian keamanan dan riset teknologi Perusahaan ABC pada 2024:\n\n- Berhasil memperoleh **Sertifikasi ISO 27001** untuk standar keamanan informasi.\n- Tim Riset & Pengembangan (RnD) sukses mendaftarkan **5 paten teknologi baru**.`,
      sources,
    };
  }

  if (isSummaryQuery) {
    return {
      answer: `Berikut ringkasan dokumen **${primaryDoc.original_name}**:\n\n- **Profil**: Perusahaan ABC didirikan tahun 2010 di bidang teknologi informasi.\n- **Kinerja Keuangan**: Pendapatan tahun 2024 mencapai **Rp 50 miliar** dan ditargetkan **Rp 80 miliar** pada 2025.\n- **Produk Inti**: Sistem Manajemen Dokumen (200 klien), Platform AI Chatbot 24 jam, dan Cloud Storage hingga 10 TB.\n- **Pencapaian**: Sertifikasi ISO 27001, 5 paten baru, serta pertumbuhan tim dari 150 menjadi 250 karyawan.\n- **Rencana Mendatang**: Ekspansi ke Malaysia dan Singapura mulai Q1 2025.`,
      sources,
    };
  }

  // Generic excerpt response for uploaded documents
  const lines = primaryChunk.text.split("\n").filter((l) => l.trim().length > 0);
  const relevantLines = lines.slice(0, 5).join("\n- ");
  return {
    answer: `Berdasarkan informasi yang ditemukan dalam dokumen **${primaryDoc.original_name}**:\n\n- ${relevantLines}\n\n*Informasi ini disajikan sesuai dengan konteks dokumen yang telah diunggah.*`,
    sources,
  };
}

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
    // sort updated_at desc
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

  deleteConversation: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const filtered = convs.filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CONVERSATIONS, filtered);
  },

  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    await new Promise((r) => setTimeout(r, 600)); // natural typing latency
    const convs = getStored<ConversationDetail[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);

    let targetConv = req.conversation_id ? convs.find((c) => c.id === req.conversation_id) : undefined;
    const isNew = !targetConv;

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

    // Run RAG query
    const ragResult = ragAnswer(req.question, docs);

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: ragResult.answer,
      created_at: new Date().toISOString(),
      sources: ragResult.sources,
    };
    targetConv.messages.push(assistantMsg);

    setStored(STORAGE_KEYS.CONVERSATIONS, convs);

    return {
      conversation_id: targetConv.id,
      answer: assistantMsg.content,
      sources: ragResult.sources,
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

    // set to queued
    docs[docIndex].status = "queued";
    docs[docIndex].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    // Async pipeline transition: queued -> processing -> completed
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

  upload: async (file: File): Promise<{ id: string; original_name: string; status: string; message: string }> => {
    const docId = crypto.randomUUID();
    let textContent = "";

    try {
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        textContent = await file.text();
      } else {
        textContent = `Dokumen: ${file.name}\nUkuran: ${(file.size / 1024).toFixed(1)} KB\nTipe: ${file.type || "file"}\nKonten dokumen telah diekstraksi dan siap diproses dalam basis pengetahuan RAG.`;
      }
    } catch {
      textContent = `Dokumen: ${file.name} diproses ke dalam knowledge base.`;
    }

    const newDoc: Document = {
      id: docId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      status: "queued",
      checksum: "chk_" + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chunks: [
        {
          id: crypto.randomUUID(),
          document_id: docId,
          document_name: file.name,
          page: 1,
          text: textContent,
        },
      ],
    };

    const docs = getStored<Document[]>(STORAGE_KEYS.DOCUMENTS, DEFAULT_DOCUMENTS);
    docs.unshift(newDoc);
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    // Simulate async background ingestion pipeline
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
        }, 2500);
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
