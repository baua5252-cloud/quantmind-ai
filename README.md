# quant Mind AI

A powerful AI assistant that runs in the browser — answer questions, analyze files, search the web, write code, and more.

## Features

- **Smart Chat** — Streaming AI responses with full conversation history and context memory
- **Web Search** — Toggle live web search for up-to-date information
- **File Analysis** — Upload PDF, DOCX, CSV, Excel, and images for AI analysis
- **Multi-Task AI** — Code generation, debugging, translation, summarization, financial analysis
- **Modern UI** — ChatGPT-style interface with dark mode and mobile responsiveness
- **Authentication** — Secure JWT-based user accounts
- **Rate Limiting** — API protection against abuse

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TailwindCSS, Zustand |
| Backend | FastAPI (Python), SQLAlchemy, asyncpg |
| AI Engine | OpenAI GPT-4o-mini |
| Database | PostgreSQL |
| Auth | JWT (python-jose), bcrypt |
| Deployment | Docker, Vercel, Railway |

## Quick Start

```bash
# 1. Start database
docker run -d --name omnimind-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=omnimind -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your OPENAI_API_KEY
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

## One-Command Deploy (Docker)

```bash
export OPENAI_API_KEY=sk-your-key
docker-compose up -d --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions (Vercel, Railway, Render, VPS).

## Project Structure

```
chatbox/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings & env vars
│   │   ├── auth.py           # JWT authentication
│   │   ├── database.py       # Async PostgreSQL setup
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py       # Auth endpoints
│   │   │   ├── chat.py       # Chat/streaming endpoints
│   │   │   └── files.py      # File upload endpoints
│   │   └── services/
│   │       ├── ai_engine.py  # OpenAI integration & tools
│   │       ├── web_search.py # DuckDuckGo web search
│   │       └── file_processor.py  # PDF/DOCX/CSV extraction
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React UI components
│   │   ├── stores/           # Zustand state management
│   │   └── lib/              # API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── DEPLOYMENT.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/:id` | Get conversation with messages |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |
| POST | `/api/chat/send` | Send message (streaming SSE) |
| POST | `/api/files/upload-and-chat` | Upload file + chat (streaming) |
| GET | `/api/health` | Health check |

## License

MIT
