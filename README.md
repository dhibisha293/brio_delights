# 🍰 Brio Delights

A bakery management system and profit calculator built with React, FastAPI, and Supabase.

---

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (Deployed on **Vercel**)
- **Backend**: FastAPI + Python 3.11 + Uvicorn (Deployed on **Render**)
- **Database & Auth**: Supabase PostgreSQL
- **AI Assistant**: OpenAI / Groq integration via FastAPI

---

## 🚀 Quick Deployment Guide

Deploying Brio Delights involves 3 simple steps:
1. **Set up Supabase Database**
2. **Deploy Backend to Render**
3. **Deploy Frontend to Vercel**

---

### Step 1: Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **Project Settings → API** and copy:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role key** (secret) (`SUPABASE_SERVICE_ROLE_KEY`)
3. Go to the **SQL Editor** in Supabase and run the SQL script in [`backend/schema.sql`](backend/schema.sql).

---

### Step 2: Deploy Backend to Render

You can deploy the backend using either **Render Blueprints** (automatic) or as a **Web Service** (manual).

#### Option A: Automatic via Render Blueprint (Recommended)
1. Log in to [render.com](https://render.com) and click **New +** → **Blueprint**.
2. Connect your Git repository. Render will automatically detect [`render.yaml`](render.yaml).
3. When prompted, fill in your environment variables:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role key.
   - `FRONTEND_ORIGIN`: Your frontend URL (or leave blank initially; Vercel preview domains are allowed automatically).
   - `AI_API_KEY`: *(Optional)* Your OpenAI or Groq API key (`gsk_...`).
   - `AI_MODEL`: `gpt-4o-mini` (or leave default).
4. Click **Apply**. Render will build and deploy your backend service.
5. Once deployed, note down your backend URL (e.g., `https://brio-delights-api.onrender.com`).

#### Option B: Manual Web Service Setup
1. On Render, click **New +** → **Web Service** and connect your repository.
2. Configure the following fields:
   - **Name**: `brio-delights-api`
   - **Language**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.9`
   - `SUPABASE_URL` = *(Your Supabase URL)*
   - `SUPABASE_SERVICE_ROLE_KEY` = *(Your Supabase Service Role Key)*
   - `SUPABASE_SSL_VERIFY` = `true`
   - `FRONTEND_ORIGIN` = `https://your-frontend.vercel.app` *(add after frontend is deployed)*
   - `AI_API_KEY` = *(Your OpenAI or Groq key, optional)*
   - `AI_MODEL` = `gpt-4o-mini`
4. Click **Create Web Service**.

> **Note on Render Free Tier**: Free web services sleep after 15 minutes of inactivity. On the first request after sleeping, it takes ~20–45 seconds to wake up. The frontend has been configured with an extended timeout to wait for cold starts gracefully.

---

### Step 3: Deploy Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or leave as `.` root — the included root `vercel.json` and `package.json` support both automatically)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g. `https://brio-delights-api.onrender.com`)
   *(Do not include a trailing slash; any trailing slashes are automatically handled).*
5. Click **Deploy**.
6. When Vercel finishes deploying, copy your production domain (e.g., `https://brio-delights.vercel.app`).
7. *(Optional)* Return to Render and update `FRONTEND_ORIGIN` to include your Vercel URL. Note that all `*.vercel.app` domains are already permitted by default via backend CORS regex.

---

## 💻 Local Development

1. **Clone repository & copy environment files**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Run Backend**:
   ```bash
   cd backend
   python -m venv .venv
   # On Windows: .venv\Scripts\activate
   # On macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Run Frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:5174](http://localhost:5174) in your browser.
