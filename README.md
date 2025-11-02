# TigerTix

Three-service demo with a React UI and an LLM assistant. Users can view events and purchase tickets. The assistant **proposes** bookings and only books after **explicit confirmation**. SQLite backs all data.

---

## Services & Ports

- **Admin (5000)** – create events  
  - `POST /api/admin/events`
- **Client (6001)** – list + purchase  
  - `GET  /api/events`  
  - `POST /api/events/:id/purchase`
- **LLM (7000)** – parse natural language + confirm bookings  
  - `POST /api/llm/parse` → returns `{ intent, event, tickets }` (no side effects)  
  - `POST /api/llm/confirm` → transactional booking  
  - `GET  /api/llm/health` → `{ ok: true }`
- **Frontend (3000)** – React UI (talks to Client + LLM)

> Shared DB: `backend/shared-db/database.sqlite`

---

## Quick Start (Windows PowerShell, from project root)

### Admin (5000)
```powershell
cd backend\admin-service
npm ci
node .\server.js
# -> http://localhost:5000

### Client (6001)
cd backend\client-service
npm ci
node .\server.js
# -> http://localhost:6001

### LLM (7000)
cd backend\llm-driven-booking
npm ci
# optional: .env with OPENAI_API_KEY= (tests mock this)
node .\server.js
# -> http://localhost:7000

### Frontend (3000)
cd frontend
npm ci
npm start
# opens http://localhost:3000

Seed / Verify / Purchase
use: Invoke-RestMethod -Uri http://localhost:5000/api/admin/events -Method Post -ContentType "application/json" -Body '{"name":"Career Fair","date":"2025-11-15","tickets":3}'
