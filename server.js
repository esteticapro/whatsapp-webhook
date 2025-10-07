import express from "express";
import http from "http";
import { Server } from "socket.io";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const { Client, LocalAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, ".wwebjs_auth") // 👈 fixa a pasta da sessão no Render
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", async (qr) => {
  console.log("✅ QR Code gerado. Acesse o site para escanear.");
  const qrImage = await qrcode.toDataURL(qr);
  io.emit("qr", qrImage);
});

client.on("ready", () => {
  console.log("✅ Cliente conectado e pronto!");
  io.emit("ready");
});

client.on("authenticated", () => {
  console.log("🔐 Autenticado com sucesso!");
  io.emit("authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha de autenticação:", msg);
  io.emit("auth_failure", msg);
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Cliente desconectado:", reason);
  io.emit("disconnected", reason);
});

client.initialize();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
