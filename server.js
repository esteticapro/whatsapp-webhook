const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let client;

function initializeWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth(),
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

  // 🔹 Mostra QR Code no log do Render
  client.on("qr", (qr) => {
    console.clear();
    console.log("📱 Escaneie este QR Code para conectar o WhatsApp:\n");
    qrcodeTerminal.generate(qr, { small: true });
  });

  // 🔹 Quando conectar
  client.on("ready", () => {
    console.log("✅ WhatsApp conectado com sucesso!");
  });

  // 🔹 Quando desconectar
  client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp desconectado:", reason);
    console.log("🔄 Tentando reconectar...");
    client.destroy();
    setTimeout(initializeWhatsApp, 5000); // tenta reconectar automaticamente
  });

  client.initialize();
}

// Inicia o cliente
initializeWhatsApp();

// 🔹 Endpoint básico só pra Render não dormir
app.get("/", (req, res) => {
  res.send("Servidor WhatsApp ativo 🚀");
});

// 🔹 Porta Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🌐 Servidor rodando na porta ${PORT}`));
