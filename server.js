const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("QR RECEBIDO", qr);
  qrcode.generate(qr, { small: true });
  io.emit("qr", qr);
});

client.on("ready", () => {
  console.log("✅ Cliente WhatsApp conectado!");
  io.emit("ready");
});

client.on("authenticated", () => {
  console.log("🔒 Autenticado com sucesso!");
});

client.on("auth_failure", () => {
  console.log("❌ Falha na autenticação, tente novamente.");
});

app.get("/", (req, res) => {
  res.send("Servidor WhatsApp rodando com sucesso 🚀");
});

client.initialize();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
