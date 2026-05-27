# VedaAI – AI Assessment Creator

> **Full-Stack Engineering Assignment** | VedaAI Internship

A production-grade, full-stack AI-powered assessment creator. Teachers configure exam parameters; the system generates structured question papers instantly using AI — with real-time progress updates via WebSockets.

---

## ✨ Live Features

| Feature | Description |
|---|---|
| 🧠 **AI Question Generation** | Powered by Google Gemini API with a high-fidelity fallback mock generator |
| ⚡ **Real-time Progress** | Live WebSocket stepper showing each stage of generation |
| 📋 **Multi-step Form** | Validated 3-step form with question types, marks, and file upload |
| 📄 **Exam Paper View** | Printable A4-format exam paper with student info fields |
| 📥 **PDF Export** | Download as properly-formatted PDF (html2pdf.js) |
| 🔄 **Regenerate** | One-click regeneration for any assessment |
| 🧱 **Resilient Architecture** | Works without MongoDB or Redis — automatic in-memory fallbacks |

---

## 🏗️ Architecture

```
veda-assessment-creator/
├── backend/                   # Express + TypeScript API server
│   ├── src/
│   │   ├── config/db.ts       # MongoDB connection (in-memory fallback)
│   │   ├── models/            # Mongoose Assessment schema
│   │   ├── queues/queue.ts    # BullMQ + Redis (in-memory fallback queue)
│   │   ├── services/
│   │   │   ├── aiService.ts   # Gemini API + high-fidelity mock generator
│   │   │   └── assessmentRepository.ts  # DB abstraction layer
│   │   ├── workers/           # BullMQ background generation worker
│   │   └── server.ts          # Express + Socket.io server
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                  # Next.js 16 + TypeScript + TailwindCSS
    └── src/
        ├── app/
        │   ├── page.tsx          # Dashboard
        │   ├── create/page.tsx   # Multi-step assessment form
        │   └── assessment/[id]/  # Live progress + output view
        └── store/assessmentStore.ts  # Zustand + Socket.io client
```

### System Flow

```
[Teacher fills form] 
    → POST /api/assessments 
    → MongoDB save (or in-memory) 
    → BullMQ job queued (or in-memory queue) 
    → Worker: AI generates questions (Gemini or mock) 
    → WebSocket broadcasts progress steps 
    → Frontend stepper updates in real-time 
    → Assessment saved → Output page rendered
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router) + **TypeScript**
- **TailwindCSS** – Utility-first styling
- **Zustand** – Global state management
- **Socket.io-client** – Real-time WebSocket updates
- **html2pdf.js** – PDF generation
- **Lucide React** – Icon library

### Backend
- **Node.js + Express** + **TypeScript**
- **MongoDB + Mongoose** – Primary data store *(optional — falls back to memory)*
- **Redis + BullMQ** – Job queue *(optional — falls back to in-process queue)*
- **Socket.io** – WebSocket server for real-time events
- **@google/genai** – Google Gemini 2.0 Flash API

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- *(Optional)* MongoDB and Redis (app works without them)

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY (optional)
npm run dev
```

The backend starts on **http://localhost:5000**

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:3000**

### Running without MongoDB/Redis

The app automatically detects unavailable services and falls back:
- **MongoDB unavailable** → Data stored in-memory (resets on restart)
- **Redis unavailable** → BullMQ jobs processed in-process
- **Gemini API key absent** → High-fidelity topic-based mock generator used

This means **the project runs out of the box with zero configuration**.

### Deploy to Render + Vercel

1. Push this repository to GitHub.
2. On Render, connect the repo and use `render.yaml` at the root to create two services:
    - `veda-assessment-backend` (Node web service)
    - `veda-assessment-frontend` (Node web service for Next.js)
3. Set Render environment variables for the backend service:
    - `MONGODB_URI` (optional)
    - `REDIS_HOST` / `REDIS_PORT` (optional)
    - `GEMINI_API_KEY` (optional)
4. Set Render environment variables for the frontend service:
    - `NEXT_PUBLIC_API_BASE=https://<your-backend>.onrender.com/api`
    - `NEXT_PUBLIC_WS_BASE=https://<your-backend>.onrender.com`
5. Alternatively, deploy just the frontend on Vercel from the `frontend/` folder and configure Vercel env vars:
    - `NEXT_PUBLIC_API_BASE=https://<your-backend>.onrender.com/api`
    - `NEXT_PUBLIC_WS_BASE=https://<your-backend>.onrender.com`
6. If you deploy frontend to Vercel, make sure the backend URL points to the Render backend service.

### Docker (recommended)

You can run everything with Docker Compose (MongoDB, Redis, backend, frontend):

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

Use the API to create a test assessment (example):

```bash
curl -s -X POST http://localhost:5000/api/assessments \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Assessment - JS","dueDate":"2026-06-01","questionTypes":["Multiple Choice Questions (MCQ)"],"totalQuestions":6,"totalMarks":12,"instructions":"Focus on core concepts"}' | jq
```

---

## ⚙️ Environment Variables

```env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/veda-assessment  # optional
REDIS_HOST=127.0.0.1                                   # optional
REDIS_PORT=6379                                        # optional
GEMINI_API_KEY=your_key_here                           # optional
```

---

## 🎯 Extra Features (Bonus)

- ✅ Download as PDF (proper A4 formatting, not raw HTML print)
- ✅ Regenerate button on output page
- ✅ Visual difficulty badges (Easy / Moderate / Hard)
- ✅ Collapsible sections in interactive view
- ✅ Dual-view toggle (Interactive ↔ Exam Paper)
- ✅ Skeleton loaders on all async states
- ✅ Dark mode premium design with glassmorphism

---

## 📸 Approach

1. **Resilience first** – Designed the backend so it degrades gracefully without external services, making the project instantly reviewable.
2. **Real-time UX** – Used Socket.io room-based broadcasting so multiple clients can watch the same assessment being generated.
3. **AI prompt engineering** – The structured JSON prompt ensures the LLM output maps cleanly to typed interfaces without re-parsing.
4. **Mock generator** – A topic-aware question bank ensures realistic output even without an API key.
5. **Component isolation** – Each UI section (stepper, exam paper, section block) is independently testable.

---

## 📄 License

MIT © VedaAI Assignment Submission
