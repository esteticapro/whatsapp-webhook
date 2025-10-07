const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let client;

// Função para inicializar o cliente WhatsApp
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
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("📱 QR Code gerado!");
    qrcode.toDataURL(qr, (err, url) => {
      io.emit("qr", url);
    });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp conectado!");
    io.emit("ready", "WhatsApp conectado!");
  });

  client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp desconectado:", reason);
    io.emit("disconnected", reason);
    initializeWhatsApp(); // reinicia o cliente
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Falha de autenticação:", msg);
  });

  client.initialize();
}

initializeWhatsApp();

// Enviar mensagem
app.post("/send-message", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
  }

  if (!client) {
    return res.status(400).json({ error: "Cliente não inicializado" });
  }

  try {
    await client.sendMessage(to + "@c.us", message);
    res.json({ success: true, to, message });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
