const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "tiger_tix_secret";

// In-memory users store
let users = [];

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    users.push({ email, password: hashed });

    res.json({ message: "User registered" });
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid login" });

    const token = jwt.sign({ email }, SECRET, { expiresIn: "30m" });

    res.json({ token, email });
});

// Example protected route
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

app.listen(4000, () => {
    console.log("Auth service running on http://localhost:4000");
});
