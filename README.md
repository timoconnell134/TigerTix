# Project Overview

TigerTix is a microservice-based ticketing application with a React frontend and an LLM-powered booking assistant. Users can browse events, purchase tickets, and interact with the system using natural-language commands. The backend consists of independently running services that communicate via REST APIs and share a common SQLite database. A CI/CD pipeline automatically tests and deploys the system to ensure stability and reliability.
# Demo Video
https://youtu.be/ZeSd6qpnDVc

# Team Members, Instructor, TAs, and Roles
- Brayden Bennett- Developer
- Timothy O'Connell- Developer

**Instructor** 
-Julian Langston Brinkley

**Teaching Assistants**
-Colt Doster
-ATIK ENAM

# License (MIT)

This project is released under the MIT License.
Full license text available at:
https://choosealicense.com/licenses/mit/

# Tech Stack

**Frontend**
- React  
- JavaScript (ES6+)

**Backend**
- Node.js  
- Express  
- SQLite (file-based database)

**AI / LLM**
- OpenAI or compatible LLM API for natural-language parsing and booking assistance

**Infrastructure**
- Microservices architecture (Admin, Client, LLM Booking)  
- REST API communication  
- Deployed on Vercel (frontend) + Render/Railway (backend)  
- CI/CD using GitHub Actions



# Architecture Summary (Microservices + Data Flow)

TigerTix is composed of three primary backend services and a React frontend, all communicating over REST:

**Admin Service (port 5000)**
- Creates and manages events  
- Endpoint: `POST /api/admin/events`  
- Writes directly to the SQLite database  

 **Client Service (port 6001)**
- Lists events and handles ticket purchases  
- Endpoints:  
  - `GET /api/events`  
  - `POST /api/events/:id/purchase`  
- Reads/writes to the SQLite database  

**LLM Booking Service (port 7000)**
- Parses natural-language user input  
- Proposes ticketing intents without modifying data  
- Confirms bookings through the Client Service  
- Endpoints:  
  - `POST /api/llm/parse`  
  - `POST /api/llm/confirm`  
  - `GET /api/llm/health`  

**Frontend (port 3000 )**
- React SPA that interacts with the Client + LLM services  
- Displays events, supports ticket purchases, and provides an assistant UI

 **Shared Database**
- SQLite file: `backend/shared-db/database.sqlite`  
- Used by Admin and Client services for consistent event + inventory storage

# Installation & Setup Instructions

**Client Service**
cd backend/client-service
npm ci
node .\server.js
http://localhost:6001

**LLM Booking Service**
cd backend/llm-driven-booking
npm ci
node .\server.js
http://localhost:7000

**Frontend**
cd frontend
npm ci
npm start
http://localhost:3000

**Admin Service**
cd backend/admin-service
npm ci
node .\server.js
http://localhost:7000

# Environment Variables Setup

**Frontend (frontend/.env)**
REACT_APP_CLIENT_BASE_URL=[CLIENT_URL]
REACT_APP_ADMIN_BASE_URL=[ADMIN_URL]
REACT_APP_LLM_BASE_URL=[LLM_URL]

**LLM Booking Service (backend/llm-driven-booking/.env)**
OPENAI_API_KEY=[YOUR_OPENAI_KEY]
CLIENT_BASE_URL=[CLIENT_URL]

**Admin Service (backend/admin-service/.env)**
DATABASE_PATH=../shared-db/database.sqlite

**Client Service (backend/client-service/.env)**
DATABASE_PATH=../shared-db/database.sqlite

# How to Run Regression Tests
npm install
npm test
