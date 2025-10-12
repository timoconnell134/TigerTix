Admin (5000): POST /api/admin/events

Client (6001): GET /api/events, POST /api/events/:id/purchase

Frontend (3000): UI only; talks to client service.

Start services

Terminal A (Admin, 5000)

cd backend\admin-service
npm ci
node .\server.js
# -> Admin service on http://localhost:5000


Terminal B (Client, 6001)

cd backend\client-service
npm ci
node .\server.js
# -> Client service on http://localhost:6001

Terminal C (Frontend, 3000)

cd frontend
npm ci
npm start
# Browser opens http://localhost:3000

Seed data by POSTing to the admin API (e.g., Invoke-RestMethod -Method Post http://localhost:5000/api/admin/events -ContentType "application/json" -Body '{"name":"Career Fair","date":"2025-11-15","tickets":3}'). Verify events at http://localhost:6001/api/events (JSON) and in the React UI; buy tickets via the UI or POST http://localhost:6001/api/events/:id/purchase and watch counts update (409 = sold out, 404 = bad id). If needed, delete backend\shared-db\database.sqlite and restart admin then client to reset. The frontend talks only to the client service; admin is used solely to create/update events.