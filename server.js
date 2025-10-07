// =======================
// 🔗 Dependências
// =======================
import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

// =======================
// ⚙️ Configurações básicas
// =======================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =======================
// 🤖 Inicialização do cliente WhatsApp
// =======================
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./session",
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let qrCodeGenerated = null;
let isReady = false;

// =======================
// 🎯 Eventos do WhatsApp
// =======================
client.on("qr", async (qr) => {
  console.log("🔹 Novo QR Code gerado");
  qrCodeGenerated = await qrcode.toDataURL(qr);
  io.emit("qr", qrCodeGenerated);
  io.emit("message", "Escaneie o QR Code com seu celular 📱");
});

client.on("authenticated", () => {
  console.log("✅ Sessão autenticada com sucesso");
  io.emit("authenticated", "Sessão autenticada com sucesso ✅");
});

client.on("ready", () => {
  console.log("🚀 Cliente WhatsApp está pronto!");
  isReady = true;
  io.emit("ready", "✅ WhatsApp conectado com sucesso!");
});

client.on("disconnected", () => {
  console.log("⚠️ Cliente desconectado, reiniciando...");
  io.emit("message", "Cliente desconectado, reiniciando...");
  client.initialize();
});

// =======================
// 🌐 Rotas HTTP simples
// =======================
app.get("/", (req, res) => {
  res.send("Servidor WhatsApp rodando ✅");
});

// =======================
// 🔥 Iniciar cliente e servidor
// =======================
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  client.initialize();
});
