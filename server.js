import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

let qrCodeData = null;
let isConnected = false;

// Inicializa o cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Evento: Gera QR Code
client.on("qr", async (qr) => {
  console.log("🔹 QR Code recebido. Escaneie para conectar.");
  qrCodeData = await qrcode.toDataURL(qr); // converte para imagem base64
});

// Evento: Cliente pronto
client.on("ready", () => {
  console.log("✅ WhatsApp conectado!");
  isConnected = true;
  qrCodeData = null;
});

// Evento: Mensagem recebida (opcional)
client.on("message", (msg) => {
  console.log(`📩 Mensagem de ${msg.from}: ${msg.body}`);
});

// Inicializa o cliente
client.initialize();

// Endpoint principal
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Conectar WhatsApp</title>
        <style>
          body {
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: Arial;
          }
          img {
            margin-top: 20px;
            width: 300px;
            height: 300px;
          }
        </style>
      </head>
      <body>
        <h1>WhatsApp Webhook</h1>
        ${
          isConnected
            ? "<h2>✅ Conectado com sucesso!</h2>"
            : qrCodeData
            ? `<h3>Escaneie o QR Code abaixo:</h3><img src='${qrCodeData}' />`
            : "<h3>Aguardando geração do QR Code...</h3>"
        }
      </body>
    </html>
  `);
});

// Endpoint para checar status (útil para o sistema)
app.get("/status", (req, res) => {
  res.json({ connected: isConnected });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
