# AI Chatbot MVP — React Web Application

A modern AI-powered document chatbot with RAG (Retrieval-Augmented Generation), built as a React SPA with TypeScript, Tailwind CSS, and Vite.

## Features

- **Document Chat with RAG**: Ask questions based on uploaded documents with cited sources, page numbers, and markdown-rendered answers.
- **Document Management**: Upload PDF, PNG, JPG, and text documents with progress tracking, processing status pipeline (`queued` -> `processing` -> `completed`), reprocess capabilities, and soft deletion.
- **Conversation History**: Search, view, resume, and delete past conversations with Indonesian relative timestamps.
- **Admin Dashboard**: System statistics overview (Total Dokumen, Total Percakapan, Dokumen Selesai, Total Pesan) and recent document monitor.
- **Authentication**: Role-based access control (Admin & User) with secure session persistence.
- **Responsive UI**: Indonesian language interface with clean Tailwind CSS styling, responsive sidebar, toast notifications, and accessible confirmation dialogs.

## Quick Start

```bash
npm install
npm run dev
```

The app will be available on `http://localhost:3000`.

### Default Credentials

- **Admin Account**: `admin@example.com` / `Admin123!`
- **User Account**: `user@example.com` / `User123!`
