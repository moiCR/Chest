import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.js";
const app = express();
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
