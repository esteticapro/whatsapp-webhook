import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

let qrCodeData = null;

client.on("qr", (qr) => {
  console.log("QR Code gerado!");
  qrCodeData = qr;
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
  qrCodeData = null;
});

client.initialize();

// Rota para obter o QR Code em Base64
app.get("/qrcode", async (req, res) => {
  if (qrCodeData) {
    const qrCodeImage = await qrcode.toDataURL(qrCodeData);
    res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
  } else {
    res.send("✅ WhatsApp já conectado!");
  }
});

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor do WhatsApp rodando corretamente!");
});

// Render usa a porta da variável de ambiente
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
