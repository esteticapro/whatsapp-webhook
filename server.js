import express from "express";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";
import cors from "cors";
import bodyParser from "body-parser";

const { Client, LocalAuth } = pkg;
const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// Cria cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let qrCodeData = null;
let isConnected = false;

// Evento: QR Code gerado
client.on("qr", async (qr) => {
  console.log("✅ QR Code gerado. Acesse o site para escanear.");
  qrCodeData = await qrcode.toDataURL(qr);
});

// Evento: Autenticado
client.on("authenticated", () => {
  console.log("🔐 WhatsApp autenticado com sucesso!");
  isConnected = true;
  qrCodeData = null;
});

// Evento: Pronto para uso
client.on("ready", () => {
  console.log("💬 Cliente WhatsApp pronto para uso!");
});

// Evento: Desconectado
client.on("disconnected", () => {
  console.log("❌ Cliente desconectado.");
  isConnected = false;
});

client.initialize();

// Rota: mostra QR Code no navegador
app.get("/qrcode", (req, res) => {
  if (isConnected) {
    return res.send("<h2>✅ WhatsApp já conectado!</h2>");
  }
  if (!qrCodeData) {
    return res.send("<h2>Gerando QR Code... Atualize em alguns segundos.</h2>");
  }

  res.send(`
    <html>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;">
        <h2>Escaneie o QR Code abaixo para conectar o WhatsApp:</h2>
        <img src="${qrCodeData}" alt="QR Code do WhatsApp" />
      </body>
    </html>
  `);
});

// Endpoint para verificar status
app.get("/", (req, res) => {
  res.json({
    status: isConnected ? "conectado" : "aguardando conexão",
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
