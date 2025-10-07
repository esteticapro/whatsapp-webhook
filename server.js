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

// Inicializa o cliente WhatsApp
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

// Evento: Pronto
client.on("ready", () => {
  console.log("💬 Cliente WhatsApp pronto para uso!");
});

// Evento: Desconectado
client.on("disconnected", () => {
  console.log("❌ Cliente desconectado.");
  isConnected = false;
});

client.initialize();

// ✅ Exibe QR Code direto na página principal
app.get("/", (req, res) => {
  if (isConnected) {
    return res.send(`
      <html>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;text-align:center;">
          <h2>✅ WhatsApp já conectado!</h2>
          <p>O bot está ativo e pronto para uso.</p>
        </body>
      </html>
    `);
  }

  if (!qrCodeData) {
    return res.send(`
      <html>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;text-align:center;">
          <h2>Gerando QR Code...</h2>
          <p>Atualize em alguns segundos se o código não aparecer.</p>
        </body>
      </html>
    `);
  }

  res.send(`
    <html>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;text-align:center;">
        <h2>Escaneie o QR Code abaixo para conectar o WhatsApp:</h2>
        <img src="${qrCodeData}" alt="QR Code do WhatsApp" style="margin-top:20px;width:300px;height:300px;" />
        <p style="margin-top:20px;color:gray;">Abra o WhatsApp → Dispositivos conectados → Escanear QR Code</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
