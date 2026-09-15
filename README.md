# Brio Delights

Profit calculator for home bakers. This first version is login and bakery name only.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI
- Auth and database: Supabase

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the project URL and the **service role** key.
3. In the Supabase SQL editor, run [`backend/schema.sql`](backend/schema.sql).
4. Copy env files:

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

5. Put your Supabase URL and service role key in `backend/.env`.

6. Backend:

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

7. Frontend (another terminal):

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — create an account with your bakery name, then log in.
