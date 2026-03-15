# Omni Mind AI - Deployment with Railway / Render / VPS

## Architecture Overview

```
┌────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Next.js      │────▶│   FastAPI         │────▶│ PostgreSQL  │
│   Frontend     │     │   Backend         │     │   Database   │
│   (Vercel)     │     │   (Railway/       │     │  (Railway/   │
│                │     │    Render)        │     │   Render)    │
└────────────────┘     └──────────────────┘     └─────────────┘
                             │
                       ┌─────┴─────┐
                       │  OpenAI   │
                       │  API      │
                       └───────────┘
```

---

## Option 1: Docker Compose (Self-Hosted / VPS)

### Prerequisites
- Docker and Docker Compose installed
- An OpenAI API key

### Steps

1. **Clone the project** to your server.

2. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY=sk-your-key
   export SECRET_KEY=$(openssl rand -hex 32)
   ```

3. **Run Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the app:**
   - Frontend: `http://your-server:3000`
   - Backend API: `http://your-server:8000`
   - Health check: `http://your-server:8000/api/health`

---

## Option 2: Vercel (Frontend) + Railway (Backend + DB)

### Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and create a new project.

2. **Add PostgreSQL service** — Railway provides one-click Postgres.

3. **Deploy the backend:**
   - Connect your Git repo or upload the `backend/` folder.
   - Set environment variables:
     ```
     DATABASE_URL=postgresql+asyncpg://<auto-provided-by-railway>
     OPENAI_API_KEY=sk-your-key
     SECRET_KEY=<generate-a-random-key>
     CORS_ORIGINS=https://your-vercel-domain.vercel.app
     ```
   - Railway auto-detects the Dockerfile and builds.

4. Note your Railway backend URL (e.g., `https://omnimind-backend.up.railway.app`).

### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and import the `frontend/` folder.

2. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://omnimind-backend.up.railway.app
   ```

3. Deploy. Vercel auto-detects Next.js.

4. Your app is live at `https://your-project.vercel.app`!

---

## Option 3: Render (All-in-One)

### Backend

1. Create a **Web Service** on [render.com](https://render.com).
2. Point to the `backend/` directory, use Docker.
3. Set environment variables (same as Railway).

### Database

1. Create a **PostgreSQL** database on Render.
2. Copy the internal connection string to `DATABASE_URL`.

### Frontend

1. Create a **Static Site** or **Web Service** on Render.
2. Point to `frontend/`, build command: `npm run build`, publish: `.next`.
3. Set `NEXT_PUBLIC_API_URL` to your backend Render URL.

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `SECRET_KEY` | JWT signing secret (random string) | Yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes |
| `SERPAPI_KEY` | SerpAPI key (optional for web search) | No |

### Frontend (.env.local)
| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

---

## Quick Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # Edit with your keys
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local    # Edit if needed
npm run dev
```

### Database
```bash
# Start PostgreSQL (Docker)
docker run -d --name omnimind-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=omnimind -p 5432:5432 postgres:16-alpine
```

---

## Post-Deployment Checklist

- [ ] Set a strong `SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Set proper `CORS_ORIGINS` to your actual frontend domain
- [ ] Test `/api/health` endpoint
- [ ] Register a user and send a test message
- [ ] Verify streaming responses work
- [ ] Test file upload (PDF, DOCX, CSV)
- [ ] Test web search toggle

---

## Features Summary

| Feature | Status |
|---|---|
| Real-time streaming chat | ✅ |
| Conversation history | ✅ |
| Context memory (20 messages) | ✅ |
| Web search integration | ✅ |
| File upload (PDF, DOCX, CSV, Excel, Images) | ✅ |
| User authentication (JWT) | ✅ |
| Rate limiting | ✅ |
| Dark mode UI | ✅ |
| Mobile responsive | ✅ |
| Code syntax highlighting | ✅ |
| Copy code blocks | ✅ |
| Async backend | ✅ |
| PostgreSQL database | ✅ |
| Docker deployment | ✅ |
