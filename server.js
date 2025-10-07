import express from "express";
import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeData = null;
let isConnected = false;

// Inicializa o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(), // salva a sessão automaticamente
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Quando o QR Code for gerado
client.on("qr", async (qr) => {
  console.log("✅ QR Code gerado!");
  qrCodeData = await qrcode.toDataURL(qr);
});

// Quando o WhatsApp conectar com sucesso
client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
  isConnected = true;
  qrCodeData = null;
});

// Quando desconectar
client.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp desconectado:", reason);
  isConnected = false;
  client.initialize();
});

// Inicializa o WhatsApp
client.initialize();

// Rota principal (testar se o servidor está online)
app.get("/", (req, res) => {
  res.send("Servidor WhatsApp rodando corretamente 🚀");
});

// Rota para obter o QR Code
app.get("/qrcode", async (req, res) => {
  if (isConnected) {
    return res.json({ status: "connected" });
  }

  if (qrCodeData) {
    return res.json({ status: "qrcode", data: qrCodeData });
  }

  return res.json({ status: "loading" });
});

// Rota para enviar mensagem
app.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "Número e mensagem são obrigatórios." });
  }

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Porta dinâmica para o Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
