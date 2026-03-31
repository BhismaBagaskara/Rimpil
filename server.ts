import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Sheets Auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      project_id: process.env.GOOGLE_PROJECT_ID,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/sync-to-sheets", async (req, res) => {
    const { transaction } = req.body;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return res.status(400).json({ error: "GOOGLE_SPREADSHEET_ID not configured" });
    }

    try {
      const values = [
        [
          transaction.timestamp,
          transaction.type,
          transaction.merek,
          transaction.namaMotif,
          transaction.jenis,
          transaction.shading,
          transaction.grade,
          transaction.line,
          transaction.pallete,
          transaction.quantity,
          transaction.namaPengambil || "",
          transaction.posisi || "",
          transaction.namaPenerima || "",
        ],
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:M",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error syncing to sheets:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync-inventory-to-sheets", async (req, res) => {
    const { inventory } = req.body;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return res.status(400).json({ error: "GOOGLE_SPREADSHEET_ID not configured" });
    }

    try {
      const values = [
        ["Merek", "Motif", "Jenis", "Shading", "Grade", "Line", "Pallete", "Quantity", "Last Updated"],
        ...inventory.map((item: any) => [
          item.merek,
          item.namaMotif,
          item.jenis,
          item.shading,
          item.grade,
          item.line,
          item.pallete,
          item.quantity,
          item.lastUpdated,
        ]),
      ];

      // Clear existing sheet and write new data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Inventory!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error syncing inventory to sheets:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
