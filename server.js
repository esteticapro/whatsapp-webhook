const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let qrCodeData = null;

// Evento quando o QR Code é gerado
client.on("qr", async (qr) => {
  console.log("QR Code gerado!");
  qrCodeData = await qrcode.toDataURL(qr);
});

// Quando o WhatsApp conecta
client.on("ready", () => {
  console.log("✅ WhatsApp conectado!");
  qrCodeData = null;
});

// Inicializa o cliente
client.initialize();

// Endpoint para pegar o QR Code
app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    res.json({ message: "WhatsApp já conectado ou aguardando QR Code" });
  }
});

// Endpoint raiz
app.get("/", (req, res) => {
  res.send("Servidor WhatsApp está ativo 🚀");
});

// Porta dinâmica do Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
