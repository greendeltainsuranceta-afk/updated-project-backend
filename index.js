


// import express from "express";
// import cors from "cors";
// import multer from "multer";
// import path from "path";
// import crypto from "crypto";
// import fs from "fs";
// import { fileURLToPath } from "url";

// /* ===============================
//    ES MODULE __dirname FIX
// ================================ */
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /* ===============================
//    APP SETUP
// ================================ */
// const app = express();
// const port = 5000;

// app.use(cors());
// app.use(express.json());

// /* ===============================
//    PUBLIC FOLDER
// ================================ */
// const pdfDir = path.join(__dirname, "public", "pdfs");
// if (!fs.existsSync(pdfDir)) {
//   fs.mkdirSync(pdfDir, { recursive: true });
// }

// app.use("/public", express.static(path.join(__dirname, "public")));

// /* ===============================
//    IN-MEMORY STORE
// ================================ */
// const pdfStore = {};


// // hhh...
// /* ===============================
//    MULTER CONFIG
// ================================ */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, pdfDir);
//   },
//   filename: (req, file, cb) => {
//     const tempId = crypto.randomBytes(5).toString("hex");
//     cb(null, `${tempId}.pdf`);
//   },
// });

// const upload = multer({ storage });

// /* ===============================
//    ROUTES
// ================================ */

// app.get("/", (req, res) => {
//   res.send("Server running ✅");
// });

// // UPLOAD WITH CUSTOM ID
// app.post("/api/pdf/upload", upload.single("pdf"), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

//   const customId = req.body.customId?.trim();
//   const generatedId = path.parse(req.file.filename).name;
//   const id = customId || generatedId;

//   // duplicate id check
//   if (pdfStore[id]) {
//     return res.status(400).json({ error: "ID already exists" });
//   }

//   const pdfObj = {
//     id,
//     filename: req.file.originalname,
//     url: `http://localhost:${port}/public/pdfs/${req.file.filename}`,
//   };


// // const pdfObj = {
// //   id,
// //   filename: req.file.originalname,
// //   url: `http://localhost:3000/public/pdfs/${req.file.filename}`,
// // };



//   pdfStore[id] = pdfObj;

//   res.json({
//     success: true,
//     pdf: pdfObj,
//     reviewUrl: `http://localhost:3000/review/${id}`,
//   });
// });

// // 🔥 FETCH BY ID
// app.get("/api/pdf/info/:id", (req, res) => {
//   const pdf = pdfStore[req.params.id];


//   console.log(pdf)
//   if (!pdf) return res.status(404).json({ error: "PDF not found" });

//   res.json({ success: true, pdf });
// });

// app.listen(port, () => {
//   console.log(`🚀 Backend running at http://localhost:${port}`);
// });


import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

/* ===============================
   __dirname FIX
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
   MONGODB CONNECT
================================ */
const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("✅ MongoDB Connected");
  }
}
await connectDB();

/* ===============================
   PUBLIC FOLDER
================================ */
const pdfDir = path.join(__dirname, "public", "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

app.use("/public", express.static(path.join(__dirname, "public")));

/* ===============================
   MULTER CONFIG
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfDir),
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

/* 🔥 UPLOAD + INSERT MONGODB */
app.post("/api/pdf/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

  const collection = db.collection("pdfs");

  const customId = req.body.customId?.trim();
  const generatedId = path.parse(req.file.filename).name;
  const id = customId || generatedId;

  // duplicate ID check
  const exists = await collection.findOne({ id });
  if (exists) {
    return res.status(400).json({ error: "ID already exists" });
  }

  const pdfObj = {
    id,
    filename: req.file.originalname,
    url: `https://www.tunesprotect.com${port}/public/pdfs/${req.file.filename}`,
    createdAt: new Date(),
  };

  await collection.insertOne(pdfObj);

  res.json({
    success: true,
    pdf: pdfObj,
    reviewUrl: `https://www.tunesprotect.com/officials/${id}`,
  });
});

/* 🔥 REVIEW / FETCH BY ID */
app.get("/api/pdf/info/:id", async (req, res) => {
  const pdf = await db
    .collection("pdfs")
    .findOne({ id: req.params.id });

  if (!pdf) return res.status(404).json({ error: "PDF not found" });

  res.json({ success: true, pdf });
});

/* ===============================
   START SERVER
================================ */
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});

