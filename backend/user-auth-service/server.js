const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Allow JSON + CORS (in production you can tighten origin)
app.use(cors());
app.use(express.json());

// Use env var in deployment, fall back for local dev
const SECRET = process.env.JWT_SECRET || "tiger_tix_secret";

// In-memory users store (per sprint spec, no DB needed here)
let users = [];

/**
 * POST /api/auth/register
 * Body: { email, password }
 * - Hashes password with bcrypt
 * - Stores user in memory
 */
app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    users.push({ email, password: hashed });

    res.json({ message: "User registered" });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * - Verifies user + password
 * - Returns a JWT that expires in 30 minutes
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid login" });

    const token = jwt.sign({ email }, SECRET, { expiresIn: "30m" });

    res.json({ token, email });
});

/**
 * GET /api/auth/protected
 * Example protected route using Authorization: Bearer <token>
 */
app.get("/api/auth/protected", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, SECRET);
        res.json({ message: "Access granted", user: decoded });
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});

// Use dynamic port for Render/Railway, 4000 locally
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Auth service running on http://localhost:${PORT}`);
});
