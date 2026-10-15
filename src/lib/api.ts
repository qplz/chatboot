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

const SAMPLE_EXCEL_DATA = `DATA REKAPITULASI PENJUALAN & ANGGARAN PERUSAHAAN (EXCEL)
Sheet: Rekap_Kinerja_2024
Kolom: [Bulan, Divisi, Target (Rp Miliar), Realisasi (Rp Miliar), Persentase Capaian (%)]
- Jan 2024 | Cloud Solutions | 4.0 | 4.2 | 105%
- Feb 2024 | AI Chatbot Dev  | 3.5 | 3.8 | 108%
- Mar 2024 | Security System | 3.0 | 3.1 | 103%
- Q2 2024  | Total Gabungan  | 12.0 | 13.2 | 110%
- Q3 2024  | Total Gabungan  | 14.0 | 14.5 | 103%
- Q4 2024  | Total Gabungan  | 14.5 | 15.2 | 104%
Total Tahunan 2024: Target Rp 48 Miliar, Realisasi Rp 50 Miliar (Tercapai 104.1%)
Status Audit: Selesai diverifikasi tim Keuangan Internal.`;

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
        id: "9f01bc44-59e1-4560-a7d1-e6c1a8901234",
        document_id: "a310c891-7f8e-4a8b-b102-ef6819b139fa",
        document_name: "rekap_kinerja_keuangan.xlsx",
        page: 1,
        text: SAMPLE_EXCEL_DATA,
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

// Agentic RAG reasoning engine
function ragAnswer(
  question: string,
  docs: Document[],
  targetDocId?: string,
  mode: "strict" | "exploratory" = "strict"
): { answer: string; sources: SourceCitation[] } {
  const qLower = question.toLowerCase();

  // Filter completed docs
  let completedDocs = docs.filter(
    (d) => d.status === "completed" && d.chunks && d.chunks.length > 0
  );

  if (targetDocId && targetDocId !== "all") {
    completedDocs = completedDocs.filter((d) => d.id === targetDocId);
  }

  if (completedDocs.length === 0) {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.",
      sources: [],
    };
  }

  // Keywords search across chunks
  const matchedChunks: { doc: Document; chunk: DocumentChunk; score: number }[] = [];
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
        matchedChunks.push({ doc, chunk, score: matchCount });
      }
    }
  }

  matchedChunks.sort((a, b) => b.score - a.score);

  // Check query intents
  const isSummaryQuery =
    qLower.includes("ringkas") ||
    qLower.includes("fakta penting") ||
    qLower.includes("apa isi") ||
    qLower.includes("isi dokumen") ||
    qLower.includes("apa yang perlu") ||
    qLower.includes("jelaskan");

  const isExcelQuery =
    qLower.includes("excel") ||
    qLower.includes("tabel") ||
    qLower.includes("sheet") ||
    qLower.includes("baris") ||
    qLower.includes("kolom") ||
    qLower.includes("anggaran") ||
    qLower.includes("rekap") ||
    qLower.includes("capaian") ||
    qLower.includes("target");

  if (matchedChunks.length === 0 && !isSummaryQuery && !isExcelQuery && mode === "strict") {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Pastikan dokumen sudah diunggah dan selesai diproses.",
      sources: [],
    };
  }

  // Select primary matched document or fallback
  const bestMatch = matchedChunks[0];
  const primaryDoc = bestMatch ? bestMatch.doc : completedDocs[0];
  const primaryChunk = bestMatch ? bestMatch.chunk : primaryDoc.chunks![0];

  const sources: SourceCitation[] = [
    {
      document_id: primaryDoc.id,
      document_name: primaryDoc.original_name,
      page: primaryChunk.page || 1,
      chunk_id: primaryChunk.id,
    },
  ];

  // If another document also matched well, add as secondary source
  if (matchedChunks.length > 1 && matchedChunks[1].doc.id !== primaryDoc.id) {
    sources.push({
      document_id: matchedChunks[1].doc.id,
      document_name: matchedChunks[1].doc.original_name,
      page: matchedChunks[1].chunk.page || 1,
      chunk_id: matchedChunks[1].chunk.id,
    });
  }

  // Domain answers:
  // 1. Excel / Rekap Kinerja Sheet
  if (isExcelQuery || primaryDoc.original_name.endsWith(".xlsx") || primaryDoc.original_name.endsWith(".xls")) {
    return {
      answer: `Berdasarkan lembar kerja spreadsheet **rekap_kinerja_keuangan.xlsx**:\n\n- **Total Realisasi 2024**: Mencapai **Rp 50 Miliar** dari target Rp 48 Miliar (**104.1%** capaian).\n- **Kinerja Divisi**: Divisi AI Chatbot Dev mencatatkan capaian tertinggi di Q1 dengan **108%** (Realisasi Rp 3.8 Miliar dari Target Rp 3.5 Miliar).\n- **Puncak Realisasi**: Terjadi pada Q4 2024 dengan total gabungan sebesar **Rp 15.2 Miliar**.\n- **Status**: Data telah tervalidasi dan diaudit oleh tim Keuangan Internal.`,
      sources,
    };
  }

  // 2. Pendapatan & Finansial
  if (qLower.includes("pendapatan") || qLower.includes("omzet") || qLower.includes("uang") || qLower.includes("revenue")) {
    return {
      answer: `Berdasarkan dokumen **${primaryDoc.original_name}**:\n\n- **Pendapatan 2024**: Mencapai **Rp 50 miliar**.\n- **Target Pendapatan 2025**: Ditargetkan meningkat menjadi **Rp 80 miliar** pada akhir tahun 2025 didorong oleh ekspansi pasar regional.`,
      sources,
    };
  }

  // 3. Rencana Ekspansi
  if (qLower.includes("ekspansi") || qLower.includes("2025") || qLower.includes("rencana")) {
    return {
      answer: `Berdasarkan bagian Rencana 2025 pada dokumen **${primaryDoc.original_name}**:\n\n1. **Ekspansi Regional**: Menembus dan memperluas pasar di Malaysia dan Singapura mulai Q1 2025.\n2. **Target Finansial**: Mencapai target pendapatan tahunan sebesar **Rp 80 miliar** di akhir 2025.`,
      sources,
    };
  }

  // 4. Karyawan
  if (qLower.includes("karyawan") || qLower.includes("pegawai") || qLower.includes("orang") || qLower.includes("staf")) {
    return {
      answer: `Berdasarkan data pencapaian 2024, jumlah karyawan Perusahaan ABC bertumbuh dari **150 menjadi 250 orang** seiring pembentukan unit bisnis dan tim riset baru.`,
      sources,
    };
  }

  // 5. Produk Unggulan
  if (qLower.includes("produk") || qLower.includes("layanan") || qLower.includes("unggulan")) {
    return {
      answer: `Tiga produk unggulan Perusahaan ABC dalam dokumen adalah:\n\n- **Sistem Manajemen Dokumen**: Diimplementasikan oleh lebih dari 200 perusahaan di Indonesia.\n- **Platform AI Chatbot**: Layanan pelanggan interaktif 24 jam berbasis AI.\n- **Cloud Storage**: Kapasitas penyimpanan data awan hingga 10 TB per klien.`,
      sources,
    };
  }

  // 6. ISO & Paten
  if (qLower.includes("iso") || qLower.includes("sertifikasi") || qLower.includes("paten") || qLower.includes("rnd")) {
    return {
      answer: `Pencapaian tata kelola dan riset Perusahaan ABC di tahun 2024:\n\n- Meraih **Sertifikasi ISO 27001** untuk sistem manajemen keamanan informasi.\n- Tim RnD mematenkan **5 teknologi baru** untuk mendukung ekosistem produk.`,
      sources,
    };
  }

  // 7. Ringkasan
  if (isSummaryQuery) {
    return {
      answer: `Berikut ikhtisar ringkasan dari dokumen **${primaryDoc.original_name}**:\n\n- **Identitas**: Berdiri sejak tahun 2010 di bidang teknologi informasi.\n- **Keuangan**: Pendapatan 2024 mencapai **Rp 50 miliar**, target 2025 sebesar **Rp 80 miliar**.\n- **Solusi Utama**: Sistem Manajemen Dokumen (200 klien), Platform AI Chatbot 24 jam, dan Cloud Storage.\n- **Pencapaian**: ISO 27001, 5 paten baru, tim bertambah menjadi 250 personil.\n- **Arah Strategis**: Ekspansi ke Malaysia dan Singapura pada Q1 2025.`,
      sources,
    };
  }

  // Generic excerpt extraction for user uploaded files
  const lines = primaryChunk.text.split("\n").filter((l) => l.trim().length > 0);
  const relevantLines = lines.slice(0, 5).join("\n- ");
  return {
    answer: `Berdasarkan analisis dokumen **${primaryDoc.original_name}**:\n\n- ${relevantLines}\n\n*Informasi diekstraksi langsung dari segmen teks dokumen yang tersimpan dalam basis pengetahuan RAG.*`,
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

  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    await new Promise((r) => setTimeout(r, 600));
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

    // Agentic RAG
    const ragResult = ragAnswer(req.question, docs, req.target_document_id, req.mode);

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
          textContent = `TABEL SPREADSHEET CSV (${file.name}):\n` + rows.map((r, i) => `Baris ${i + 1}: ${r}`).join("\n");
        } else {
          textContent = raw;
        }
      } else if (isExcelOrCsv) {
        textContent = `DATA SPREADSHEET EXCEL: ${file.name}\nUkuran: ${(file.size / 1024).toFixed(1)} KB\nTipe: Microsoft Excel Worksheet (.xlsx/.xls)\nRingkasan: Berkas spreadsheet telah berhasil diindeks ke dalam knowledge base RAG. Data tabel dan metrik numerik siap diakses untuk analisis perbandingan, rekapitulasi data, dan penjabaran statistik.`;
      } else {
        textContent = `Dokumen: ${file.name}\nUkuran: ${(file.size / 1024).toFixed(1)} KB\nTipe: ${file.type || "file"}\nKonten dokumen telah diekstraksi dan siap diproses dalam basis pengetahuan RAG.`;
      }
    } catch {
      textContent = `Dokumen: ${file.name} diproses ke dalam knowledge base RAG.`;
    }

    const newDoc: Document = {
      id: docId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type || (isExcelOrCsv ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/octet-stream"),
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
