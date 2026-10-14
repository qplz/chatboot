# Implementation Plan — Fase 6: UI Polish AI Chatbot MVP

## Urutan berdasarkan dependensi

File yang tidak bergantung pada file lain dibuat lebih dahulu. Komponen baru (ConfirmDialog, Toast, RelativeTime) harus selesai sebelum halaman yang menggunakannya dimodifikasi.

---

- [ ] 1. Buat `apps/web/src/contexts/ToastContext.tsx` — sistem toast notification via React Context.
      Definisikan tipe `Toast { id, type: 'success'|'error'|'info'|'warning', message }`.
      Export: `ToastProvider` (menyimpan daftar toast di `useState`, auto-dismiss 4 detik via `setTimeout` di dalam `addToast`), hook `useToast()` yang mengembalikan `{ addToast, removeToast }`, dan komponen `ToastRenderer` (renders portal ke `document.body` atau fixed div di pojok kanan bawah layar, z-index tinggi). Satu file, tiga export bernama.
      Files: `apps/web/src/contexts/ToastContext.tsx`
      Verify: `npm run type-check` di `apps/web` — tidak ada TypeScript error.

- [ ] 2. Buat `apps/web/src/components/ui/Toast.tsx` — komponen visual untuk satu item toast.
      Menerima props `{ id, type, message, onDismiss }`. Warna per type: success=green-500, error=red-500, info=blue-500, warning=yellow-500. Tampilkan ikon lucide-react sesuai type (CheckCircle, XCircle, Info, AlertTriangle). Tombol close dengan `aria-label="Tutup notifikasi"`. Animasi masuk: `animate-fade-in` (definisi di globals.css atau via Tailwind `transition`). Komponen ini dipanggil oleh `ToastRenderer` di `ToastContext.tsx`.
      Files: `apps/web/src/components/ui/Toast.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 3. Buat `apps/web/src/components/ui/ConfirmDialog.tsx` — modal konfirmasi reusable.
      Props: `{ isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; cancelLabel?: string; isLoading?: boolean }`.
      Render overlay `fixed inset-0 bg-black/50 z-50` hanya jika `isOpen`. Dialog di tengah layar dengan `role="dialog"`, `aria-modal="true"`, `aria-labelledby` yang menunjuk ke elemen judul. Focus trap sederhana: `useEffect` yang memanggil `focus()` pada tombol konfirmasi saat `isOpen` true. Tombol Cancel memanggil `onCancel`, tombol Confirm (warna merah/danger) memanggil `onConfirm`. `isLoading` menonaktifkan kedua tombol dan menampilkan spinner di tombol Confirm. Keyboard: `Escape` memanggil `onCancel`. Semua teks UI Bahasa Indonesia sebagai default label.
      Files: `apps/web/src/components/ui/ConfirmDialog.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 4. Buat `apps/web/src/components/ui/RelativeTime.tsx` — komponen waktu relatif Bahasa Indonesia.
      Props: `{ date: string | Date; className?: string }`. Fungsi `toRelative(date: Date): string` menghitung selisih dari `Date.now()`:
      - < 60 detik → "baru saja"
      - < 60 menit → "X menit lalu"
      - < 24 jam → "X jam lalu"
      - < 48 jam → "kemarin"
      - else → "X hari lalu"
      Render elemen `<time dateTime={isoString} title={tanggal lengkap dalam format lokal id-ID}>` berisi teks relatif. Gunakan `className` prop untuk styling dari luar.
      Files: `apps/web/src/components/ui/RelativeTime.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 5. Update `apps/web/src/app/globals.css` — tambahkan keyframe animasi untuk toast dan loading dots.
      Tambahkan di bawah CSS yang sudah ada:
      ```css
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up { animation: fadeInUp 0.2s ease-out both; }
      ```
      Ini digunakan oleh Toast.tsx. Jangan hapus CSS yang sudah ada.
      Files: `apps/web/src/app/globals.css`
      Verify: `npm run type-check` — tidak ada error (CSS tidak ditype-check, tapi build harus tetap hijau).

- [ ] 6. Update `apps/web/src/app/layout.tsx` — wrap children dengan `ToastProvider` dan sisipkan `ToastRenderer`.
      Import `ToastProvider` dan `ToastRenderer` dari `@/contexts/ToastContext`. Wrap `<AuthProvider>` dengan `<ToastProvider>` (urutan: QueryProvider > ToastProvider > AuthProvider). Letakkan `<ToastRenderer />` di dalam `<body>` setelah semua provider. Layout ini adalah Server Component (tidak ada "use client"), sehingga ToastProvider dan ToastRenderer harus menjadi Client Components — pastikan keduanya sudah memiliki `"use client"`.
      Files: `apps/web/src/app/layout.tsx`
      Verify: `npm run build` — build berhasil tanpa error.

- [ ] 7. Update `apps/web/src/components/documents/DocumentStatusBadge.tsx` — tambah `animate-pulse` dan `aria-label`.
      Di `statusConfig`, tambahkan key `animateClass` per status: `queued` → `"animate-pulse"`, `processing` → `"animate-pulse"`, lainnya → `""`. Pada elemen `<span>`, tambahkan `animate-class` dari config dan `aria-label={config.label}`. Tidak ada perubahan lain.
      Files: `apps/web/src/components/documents/DocumentStatusBadge.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 8. Update `apps/web/src/components/chat/SourceCitation.tsx` — tambah collapsible support.
      Ubah interface Props: tambah `collapsible?: boolean` dan `initialExpanded?: boolean` (default `true`). Komponen diubah menjadi Client Component (`"use client"`). Tambah state `expanded`. Jika `collapsible` false atau undefined, render seperti semula (span inline). Jika `collapsible` true, render container `<div>` yang berisi: semua citations dalam daftar, dan tombol toggle dengan ikon `ChevronDown` / `ChevronUp` dari lucide-react. Tidak ada perubahan pada tampilan normal (non-collapsible).
      Perhatian: SourceCitation saat ini menerima satu source per komponen. Karena collapsible membutuhkan context multiple sources, buat `SourceCitationList` sebagai export tambahan dalam file yang sama: menerima `sources: Source[]` dan mengelola collapsible logic. `ChatMessage` akan menggunakan `SourceCitationList`.
      Files: `apps/web/src/components/chat/SourceCitation.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 9. Update `apps/web/src/components/chat/ChatMessage.tsx` — markdown rendering, copy button, timestamp, collapsible sources, loading animation.
      Tambahkan sebagai "use client" (sudah perlu karena akan ada useState untuk copy). Lakukan perubahan berikut:
      
      **Markdown rendering** — fungsi `renderMarkdown(text: string): React.ReactNode[]`:
      - Split teks oleh `\n\n` → setiap chunk jadi `<p>` terpisah.
      - Dalam setiap chunk, split oleh `\n` tunggal. Baris yang diawali `- ` atau `* ` dikumpulkan sebagai `<li>` dalam `<ul>`.
      - Dalam setiap baris, terapkan regex `\*\*(.+?)\*\*` → `<strong>`.
      - Baris non-list dirender sebagai text node dengan `<br>` di antara baris.
      - Return array `React.ReactNode` dengan key unik berbasis index.
      
      **Copy button** — state `copied: boolean`. Wrapper bubble menjadi `group relative`. Tombol copy (`Copy` ikon dari lucide-react, size 14) muncul `opacity-0 group-hover:opacity-100` di pojok kanan atas bubble assistant. Klik: `navigator.clipboard.writeText(content)` lalu set `copied = true`, reset ke `false` setelah 2000ms. Teks tooltip atau label berubah menjadi "Disalin!" saat copied.
      
      **Timestamp** — tambah prop `timestamp?: string` (ISO string). Jika tersedia, render `<RelativeTime date={timestamp} className="text-xs text-gray-400 mt-1" />` di bawah bubble.
      
      **Collapsible sources** — Ganti penggunaan `SourceCitation` individual dengan `SourceCitationList` dari SourceCitation.tsx. Jika sources > 2, kirim `collapsible={true}` ke `SourceCitationList`.
      
      **Loading animation** — ubah dots menjadi:
      ```tsx
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </span>
      ```
      
      Files: `apps/web/src/components/chat/ChatMessage.tsx`
      Verify: `npm run type-check` — tidak ada error.

- [ ] 10. Update `apps/web/src/components/layout/Sidebar.tsx` — recent conversations, confirm logout, user badge.
       Ubah menjadi fully client component (sudah "use client"). Import `useQuery` dari `@tanstack/react-query`, `chatApi` dari `@/lib/api`, `ConfirmDialog` dari `@/components/ui/ConfirmDialog`, `ChevronDown`/`ChevronUp` dari lucide-react.
       
       **Recent conversations section**: query `chatApi.listConversations()` dengan `queryKey: ['conversations']`. Ambil 5 item pertama dari `data?.items`. State `convExpanded: boolean` (default true). Render section "Percakapan Terbaru" yang collapsible: header dengan tombol `ChevronDown`/`ChevronUp` toggle. Setiap conversation item: link ke `/chat?conv={id}`, truncate title, active state jika `pathname.includes(conv.id)`. Jika belum ada conversations, tampilkan teks "Belum ada percakapan."
       
       **Confirm logout**: state `showLogoutConfirm: boolean`. Tombol "Keluar" hanya memanggil `setShowLogoutConfirm(true)`. Render `<ConfirmDialog isOpen={showLogoutConfirm} title="Keluar" message="Yakin ingin keluar dari aplikasi?" confirmLabel="Keluar" cancelLabel="Batal" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />`.
       
       **User badge**: Tampilkan nama dan email lebih rapi. Badge role tetap ada, tambahkan aria-label="Role pengguna".
       
       **Hover animation**: semua nav Link sudah pakai `transition` — pastikan durasi `duration-150` ditambahkan.
       
       Files: `apps/web/src/components/layout/Sidebar.tsx`
       Verify: `npm run type-check` — tidak ada error.

- [ ] 11. Update `apps/web/src/app/chat/page.tsx` — conversation title, URL pushState, useToast, auto-scroll, suggestion chips.
        
        **Metadata**: karena halaman ini "use client", metadata harus ditambahkan via `<title>` di `<head>` bukan `export const metadata`. Gunakan Next.js `<title>` tag di dalam komponen, atau buat wrapper server component. Keputusan: tambahkan metadata di root layout sebagai default "AI Chatbot MVP" — chat page tidak perlu override terpisah karena page title sudah ada di header. Alternatif: buat `apps/web/src/app/chat/layout.tsx` (server component) dengan `export const metadata = { title: "Chat | AI Chatbot" }`. Buat file layout terpisah itu.
        
        Perubahan di `chat/page.tsx`:
        - Import dan gunakan `useToast()`. Ganti `setError(getApiError(err))` dengan `addToast({ type: 'error', message: getApiError(err) })`. Hapus state `error` dan error banner JSX.
        - Header: tampilkan `existingConv?.title || "Chat Baru"` sebagai judul (bukan hanya "Chat"). Tombol "Baru" → label "Percakapan Baru" dengan ikon `Plus`.
        - `handleSend` setelah `setConversationId(res.conversation_id)`: tambahkan `window.history.pushState({}, "", `/chat?conv=${res.conversation_id}`)`.
        - Auto-scroll: sudah ada `useEffect` yang scroll ke `bottomRef`. Pastikan `behavior: "smooth"` sudah ada (sudah ada di kode existing).
        - Suggestion chips: perbaiki label menjadi lebih deskriptif dan tambahkan 1-2 chip yang lebih konkret.
        - Pass `timestamp` ke ChatMessage — ubah `LocalMessage` interface: tambah `timestamp?: string`. Saat message dibuat dari API response (`res`), simpan `timestamp: new Date().toISOString()`. Saat load dari existing conversation (`existingConv.messages`), map `timestamp: m.created_at`. Pass ke `<ChatMessage timestamp={msg.timestamp} ...>`.
        
        Files: `apps/web/src/app/chat/page.tsx`, `apps/web/src/app/chat/layout.tsx` (baru)
        Verify: `npm run type-check` — tidak ada error.

- [ ] 12. Update `apps/web/src/app/documents/page.tsx` — upload progress XHR, ConfirmDialog delete, useToast, empty state CTA.
        
        **Upload progress dengan XHR**: Ganti `documentsApi.upload` dengan fungsi lokal `uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<...>` menggunakan `XMLHttpRequest`. State baru: `uploadProgresses: Record<string, number>` (key = file.name + timestamp). Saat upload dimulai, set progress 0. Di `xhr.upload.onprogress`, update `(event.loaded / event.total) * 100`. Setelah selesai (onload), hapus dari map. Progress bar per file: tampilkan di bawah nama file saat sedang upload (isLoading state per file).
        
        Karena upload sekarang pakai XHR manual, `uploadMutation` dari useMutation diganti dengan fungsi `handleUploadFiles` yang mengelola semua XHR requests secara paralel. State `uploading: boolean` (true jika ada upload berjalan).
        
        **ConfirmDialog delete**: state `deleteTarget: { id: string; name: string } | null`. Tombol delete hanya set `deleteTarget`. Render `<ConfirmDialog>` yang confirm memanggil `deleteMutation.mutate(deleteTarget.id)` lalu clear state.
        
        **useToast**: import dan gunakan. Upload success → `addToast({ type: 'success', message: `${file.name} berhasil diunggah` })`. Upload error → `addToast({ type: 'error', message: ... })`. Delete success → `addToast({ type: 'success', message: 'Dokumen berhasil dihapus' })`.
        
        **Empty state CTA**: tambah tombol "Upload Dokumen Pertama" yang memicu `inputRef.current?.click()`.
        
        **Status badge animasi**: sudah ditangani oleh item 7 (DocumentStatusBadge). Pastikan badge dirender dari `DocumentStatusBadge`.
        
        Files: `apps/web/src/app/documents/page.tsx`
        Verify: `npm run type-check` — tidak ada error.

- [ ] 13. Update `apps/web/src/app/history/page.tsx` — RelativeTime, search filter, ConfirmDialog, empty state CTA, metadata.
        
        **Search filter**: state `search: string`. Input `<input type="text" placeholder="Cari percakapan..." />` di atas list. Filter: `data.items.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))`. Jika hasil filter kosong dan search tidak kosong, tampilkan "Tidak ada hasil untuk '{search}'".
        
        **RelativeTime**: Ganti `new Date(conv.updated_at).toLocaleDateString(...)` dengan `<RelativeTime date={conv.updated_at} />`.
        
        **ConfirmDialog delete**: state `deleteTarget: { id: string; title: string } | null`. Tombol delete hanya set state. `<ConfirmDialog>` konfirmasi memanggil `handleDelete(deleteTarget.id)`.
        
        **Empty state**: sudah ada tombol "Mulai Chat". Pastikan teks lebih deskriptif dan ada ikon yang sesuai.
        
        **Metadata layout**: buat `apps/web/src/app/history/layout.tsx` (server component) dengan `export const metadata = { title: "Riwayat | AI Chatbot" }`.
        
        Files: `apps/web/src/app/history/page.tsx`, `apps/web/src/app/history/layout.tsx` (baru)
        Verify: `npm run type-check` — tidak ada error.

- [ ] 14. Update `apps/web/src/app/documents/page.tsx` — tambah metadata layout (pisahkan dari item 12 untuk kejelasan, tapi implementasikan bersama item 12).
        Buat `apps/web/src/app/documents/layout.tsx` (server component) dengan `export const metadata = { title: "Dokumen | AI Chatbot" }`.
        Files: `apps/web/src/app/documents/layout.tsx` (baru)
        Verify: `npm run type-check` — tidak ada error.

- [ ] 15. Update `apps/web/src/app/dashboard/page.tsx` — StatCard keempat, DocumentStatusBadge, file size, link ke /documents, metadata layout.
        
        **StatCard keempat "Total Pesan"**: Tidak ada field `message_count` di API. Hitung dari conversations: karena `Conversation` type tidak memiliki messages, kita tidak bisa menghitung secara akurat dari listConversations. Tampilkan nilai `"—"` dengan label "Total Pesan" dan ikon `MessageSquare` warna amber. Ini jujur pada user bahwa data tidak tersedia.
        
        **Grid**: ubah `sm:grid-cols-3` menjadi `sm:grid-cols-2 lg:grid-cols-4`.
        
        **Tabel dokumen terbaru**: 
        - Ganti span status inline dengan `<DocumentStatusBadge status={doc.status} />`.
        - Tambah kolom ukuran file: `formatBytes(doc.file_size)` (fungsi formatBytes sudah ada di documents/page.tsx — pindahkan ke shared location atau duplikasi inline).
        - Setiap baris: klik navigasi ke `/documents` menggunakan `useRouter` (ubah div menjadi clickable atau tambah Link).
        - Tambah header "Lihat Semua" di section header yang link ke `/documents`.
        
        **Metadata**: buat `apps/web/src/app/dashboard/layout.tsx` dengan `export const metadata = { title: "Dashboard | AI Chatbot" }`.
        
        Files: `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/layout.tsx` (baru)
        Verify: `npm run type-check` — tidak ada error.

- [ ] 16. Final build verification — jalankan full build dan type check.
        Dari direktori `apps/web`: jalankan `npm run type-check` kemudian `npm run build`. Semua komponen baru dan yang dimodifikasi harus compile tanpa error. Jika ada error TypeScript, perbaiki sebelum menandai selesai.
        Files: tidak ada file baru
        Verify: `cd apps/web && npm run type-check && npm run build` — build berhasil dengan exit code 0.

---

## Ringkasan urutan dependensi

```
Item 1 (ToastContext)        ← dipakai oleh item 6, 11, 12, 13
Item 2 (Toast.tsx)           ← dipakai oleh item 1 (ToastRenderer)
Item 3 (ConfirmDialog.tsx)   ← dipakai oleh item 10, 12, 13
Item 4 (RelativeTime.tsx)    ← dipakai oleh item 9, 13
Item 5 (globals.css)         ← dipakai oleh item 2 (animasi)
Item 6 (layout.tsx)          ← depends on item 1
Item 7 (DocumentStatusBadge) ← dipakai oleh item 12, 15
Item 8 (SourceCitation.tsx)  ← dipakai oleh item 9
Item 9 (ChatMessage.tsx)     ← depends on item 4, 8
Item 10 (Sidebar.tsx)        ← depends on item 3
Item 11 (chat/page.tsx)      ← depends on item 1, 9
Item 12 (documents/page.tsx) ← depends on item 1, 3, 7
Item 13 (history/page.tsx)   ← depends on item 1, 3, 4
Item 14 (documents/layout)   ← independent
Item 15 (dashboard/page.tsx) ← depends on item 7
Item 16 (build verify)       ← depends on all
```

## Catatan penting untuk implementor

1. **"use client" boundary**: `ToastContext.tsx`, `Toast.tsx`, `ConfirmDialog.tsx`, `RelativeTime.tsx` semuanya harus memiliki `"use client"` di baris pertama karena menggunakan hooks/browser APIs.

2. **Layout files untuk metadata**: Next.js 15 mendukung per-route `layout.tsx` sebagai server component untuk metadata. Chat/history/documents/dashboard pages sudah `"use client"`, sehingga metadata HARUS didefinisikan di layout terpisah, bukan di page langsung.

3. **XHR upload di documents page**: Gunakan pattern berikut:
   ```typescript
   const xhr = new XMLHttpRequest();
   xhr.open("POST", `${BASE_URL}/api/v1/documents`);
   xhr.withCredentials = true;
   xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total * 100); };
   xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else reject(...); };
   xhr.send(formData);
   ```
   BASE_URL dari `process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"`.

4. **tailwind-merge**: Package `tailwind-merge` sudah ada di dependencies (2.5.4) — boleh digunakan untuk merging className.

5. **Tidak ada package baru**: Semua implementasi menggunakan package yang sudah ada. Markdown rendering pakai regex manual. Toast pakai React Context. Animasi pakai Tailwind utilities.

6. **Strict TypeScript**: Hindari `any`. Source type yang digunakan di ChatMessage sudah ada di `lib/api.ts` sebagai `SourceCitation` — import dan gunakan tipe tersebut.
