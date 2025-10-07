import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeData = null;

// Configuração do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

// Gera QR Code como imagem Base64
client.on("qr", async qr => {
  qrCodeData = await qrcode.toDataURL(qr);
  console.log("✅ Novo QR Code gerado!");
});

// Quando conectar com sucesso
client.on("ready", () => {
  console.log("🤖 WhatsApp conectado com sucesso!");
});

// Inicializa cliente
client.initialize();

// Rota para exibir o QR Code visualmente
app.get("/qrcode", (req, res) => {
  if (qrCodeData) {
    res.send(`
      <html>
        <body style="background:#111;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;color:#fff;font-family:sans-serif">
          <h2>📱 Escaneie o QR Code abaixo para conectar o WhatsApp</h2>
          <img src="${qrCodeData}" style="width:300px;height:300px;border-radius:10px"/>
        </body>
      </html>
    `);
  } else {
    res.send("Aguardando geração do QR Code...");
  }
});

app.listen(10000, () => {
  console.log("🌐 Servidor rodando na porta 10000");
});
