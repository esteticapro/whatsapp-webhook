import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";

const app = express();
const port = process.env.PORT || 10000;

app.use(express.static("public"));

let qrCodeData = null;

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth", // salva sessão local
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

client.on("qr", async (qr) => {
  console.log("📱 Novo QR code gerado!");
  qrCodeData = await qrcode.toDataURL(qr);
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
  qrCodeData = null; // remove o QR quando conectado
});

client.on("authenticated", () => {
  console.log("🔐 Sessão autenticada!");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  qrCodeData = null;
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Desconectado:", reason);
  client.initialize(); // tenta reconectar automaticamente
});

client.initialize();

app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.send(`<img src="${qrCodeData}" alt="QR Code" style="width:300px;height:300px;" />`);
  } else {
    res.send("<h3>✅ WhatsApp conectado! Nenhum QR disponível.</h3>");
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
