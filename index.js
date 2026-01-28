


import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";

/* ===============================
   ES MODULE __dirname FIX
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   APP SETUP
================================ */
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

/* ===============================
   PUBLIC FOLDER
================================ */
const pdfDir = path.join(__dirname, "public", "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

app.use("/public", express.static(path.join(__dirname, "public")));

/* ===============================
   IN-MEMORY STORE
================================ */
const pdfStore = {};


// hhh...
/* ===============================
   MULTER CONFIG
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfDir);
  },
  filename: (req, file, cb) => {
    const tempId = crypto.randomBytes(5).toString("hex");
    cb(null, `${tempId}.pdf`);
  },
});

const upload = multer({ storage });

/* ===============================
   ROUTES
================================ */

app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// UPLOAD WITH CUSTOM ID
app.post("/api/pdf/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

  const customId = req.body.customId?.trim();
  const generatedId = path.parse(req.file.filename).name;
  const id = customId || generatedId;

  // duplicate id check
  if (pdfStore[id]) {
    return res.status(400).json({ error: "ID already exists" });
  }

  // const pdfObj = {
  //   id,
  //   filename: req.file.originalname,
  //   url: `http://localhost:${port}/public/pdfs/${req.file.filename}`,
  // };


const pdfObj = {
  id,
  filename: req.file.originalname,
  url: `https://updated-project-backend.onrender.com/public/pdfs/${req.file.filename}`,
};

  


  pdfStore[id] = pdfObj;

  res.json({
    success: true,
    pdf: pdfObj,
    reviewUrl: `https://updated-project-frontend.vercel.app/review/${id}`,
  });
});

// 🔥 FETCH BY ID
app.get("/api/pdf/info/:id", (req, res) => {
  const pdf = pdfStore[req.params.id];
  if (!pdf) return res.status(404).json({ error: "PDF not found" });

  res.json({ success: true, pdf });
});

app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});
