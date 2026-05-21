import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.js";
const app = express();
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = new Set([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]);
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());
app.get("/", (req, res) => {
    res.json({
        message: "All ok",
    });
});
app.use("/auth", authRoutes);
const PORT = 2005;
app.listen(PORT, () => {
    console.log(`Server running in http://localhost:${PORT}`);
});
