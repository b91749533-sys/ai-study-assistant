# StudySync.ai 🎓
### Premium AI-Powered Study Assistant SaaS

StudySync.ai is a production-ready, highly polished AI Study Assistant SaaS platform designed for modern high-retention learning. Built using **Next.js 15 (App Router)**, **Prisma ORM**, **Tailwind CSS**, and **Google Gemini AI**, it leverages **Retrieval-Augmented Generation (RAG)** to index textbooks and class materials, allowing students to study smarter through interactive search and active recall tools.

---

## 🚀 Key Features

*   📂 **Course Library & Document Indexer**: Multi-format document parser supporting PDF, DOCX, PPTX, TXT, and Markdown files. Extracts text and saves vector embeddings for fast RAG search.
*   💬 **RAG AI Study Chat (Copilot)**: Ask questions directly to your textbooks or syllabus. Get detailed answers with highlighted page source citations and text snippets.
*   📚 **Interactive Spaced Flashcards**: Auto-generate flashcard sets from document context. Features an interactive card-flip study viewer with favorites tracking.
*   🎯 **Adaptive Quiz Generator**: Create custom quizzes matching selected difficulty levels (Easy, Medium, Hard). Supports MCQs, True/False, Fill-in-the-Blanks, scoring charts, and detailed AI feedback.
*   📝 **AI Note Editor**: Rich markdown notepad with side-by-side AI summary extractions (key concept abstracts, bullet outlines, vocabulary glossary sheets).
*   📅 **Study Plan Calendar**: Set an exam date and hours available, list subjects, and dynamically compile structured study tasks mapped out on a calendar grid.
*   🔍 **Global Command Palette**: `Ctrl/Cmd + K` dialog to search notes, documents, flashcards, and quizzes in real-time.
*   📈 **Study Dashboard & Analytics**: Streak tracker, study hour trends, quiz metrics utilizing responsive Recharts graphs, activity feeds, and unlocked milestone badges.
*   ⚙️ **Data Portability**: Export your entire database workspace as a structured `.json` backup file or delete your account.

---

## 🛠 Tech Stack

*   **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, TanStack Query
*   **Backend**: Next.js Server Actions, Route Handlers, Node-based document text extractors
*   **Database**: PostgreSQL / SQLite, Prisma ORM
*   **AI Integration**: Google Gemini API (`@google/generative-ai`)
*   **Visualization**: Recharts
*   **Containerization**: Docker Compose (for local PG/pgvector databases)

---

## 📁 Directory Structure

```text
├── app/                  # Next.js 15 App Router pages & server actions
│   ├── actions/          # Backend Server Actions (document, chat, note, planner, settings)
│   ├── dashboard/        # Main Dashboard Page
│   ├── login/            # Sign In Screen
│   ├── register/         # Sign Up Screen
│   ├── profile/          # User Statistics & Milestone Page
│   ├── settings/         # Theme toggles & Data backup/delete page
│   ├── workspace/        # Main Study Features tabs panel
│   ├── globals.css       # Design variables, scrollbars & glass styling
│   └── layout.tsx        # Global theme wrapper & metadata tags
├── components/           # Global reusable UI & features components
│   ├── providers/        # ThemeProvider context
│   ├── ui/               # Tailored UI library (Button, Card, Input, Badge, Skeleton)
│   ├── AppLayout.tsx     # Responsive Sidebar & Top Navigation Shell
│   ├── CommandPalette.tsx# Ctrl+K interactive lookup modal
│   ├── DashboardCharts.tsx# Recharts visual charts
│   ├── DashboardTasksList.tsx# Study task checker list
│   └── WorkspacePanel.tsx# Core multi-tab study feature workspace
├── hooks/                # Keyboard shortcut listener custom hooks
├── lib/                  # Database connections singleton (Prisma)
├── prisma/               # Database schemas & mock seeder scripts
├── services/             # Gemini AI SDK setups & document extraction layers
├── types/                # Strongly typed shared definitions
└── utils/                # Utility date/byte formatters
```

---

## ⚙️ Local Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Docker (Optional, for local PostgreSQL database setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/ai-study-assistant.git
cd ai-study-assistant
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or copy `.env.example`):
```bash
cp .env.example .env
```
Provide your actual credentials.
*   **Note**: If `GEMINI_API_KEY` is left blank, the application automatically runs in a highly detailed **Mock/Demo Mode**, allowing complete offline execution of the charts, quiz grading, planner schedules, summaries, and chat loops without any API charges!

### 3. Spin Up Local Database
If using Docker, start the PostgreSQL container containing the `pgvector` image:
```bash
docker compose up -d
```

### 4. Push Database Schema & Seed
Sync your Prisma schemas to your database and run the seeder script to populate a standard demo user:
```bash
npx prisma db push
node prisma/seed.js
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the workspace!
*   To test out-of-the-box right away, sign in on `/login` using the seeded demo email: `demo@studysync.ai`.

---

## ⚡ Deployment Guide (Vercel)

1.  Push your project code to a public/private GitHub repository.
2.  Import your repository on Vercel.
3.  Add environment variables in the Vercel Dashboard:
    *   `DATABASE_URL`: Connection string of your production PostgreSQL instance (e.g. Supabase, Neon).
    *   `GEMINI_API_KEY`: API key from Google AI Studio.
4.  Configure the build command to compile Prisma:
    *   Build Command: `prisma generate && next build`
5.  Click **Deploy**!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
