import express from "express";
import cors from "cors";
import { Client, LocalAuth } from "whatsapp-web.js";

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeImage = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  },
});

client.on("qr", async (qr) => {
  console.log("QR Code gerado!");
  qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`;
});

client.on("ready", () => {
  console.log("✅ Cliente conectado com sucesso!");
  isReady = true;
});

client.on("disconnected", (reason) => {
  console.log("❌ Cliente desconectado:", reason);
  isReady = false;
  client.initialize();
});

client.initialize();

// 🔹 Endpoint para pegar o QR code
app.get("/qr", (req, res) => {
  if (isReady) {
    return res.json({ status: "connected" });
  }

  if (!qrCodeImage) {
    return res.json({ status: "loading", message: "Gerando QR Code..." });
  }

  res.json({
    status: "qr",
    image: qrCodeImage,
  });
});

// 🔹 Endpoint para status geral
app.get("/status", (req, res) => {
  res.json({ connected: isReady });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
