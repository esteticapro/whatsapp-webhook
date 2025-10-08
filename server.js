import express from "express";
import http from "http";
import { Server } from "socket.io";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

// Instância do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
  dataPath: "./.wwebjs_auth" // Agora salva dentro do projeto
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Eventos do WhatsApp
client.on("qr", async (qr) => {
  const qrCodeImageUrl = await qrcode.toDataURL(qr);
  io.emit("qr", qrCodeImageUrl);
  console.log("✅ QR Code gerado. Escaneie para conectar.");
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado e pronto!");
  io.emit("ready");
});

client.on("authenticated", () => {
  console.log("🔐 Sessão autenticada com sucesso!");
  io.emit("authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  io.emit("auth_failure", msg);
});

client.on("disconnected", () => {
  console.log("⚠️ WhatsApp desconectado. Tentando reconectar...");
  client.initialize();
});

// Inicializar o cliente
client.initialize();

// Rota principal (frontend)
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// Inicializar servidor
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
