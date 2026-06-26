import express from "express";
import type { Request, Response } from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import cors from 'cors';
import path from "path";

import { app, server } from "./config/socket.js"
import { Routers } from "./routes/index.routes.js";




const PORT = 3000;
const frontendDistPath = path.resolve(process.cwd(), "../Frontend/dist");

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());
app.use("/api", Routers);


app.get('/', (req: Request, res: Response) =>{
    res.send("Hello PTIT")
}) 

app.use(express.static(frontendDistPath));

app.get("*", (req: Request, res: Response) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).end();
    }

    res.sendFile(path.join(frontendDistPath, "index.html"));
});

server.listen(PORT, "0.0.0.0", () =>{
    console.log(`Server is running in ${PORT}`)
    connectDB();
} )


