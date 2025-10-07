import express from "express";
import cors from "cors";
import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--no-zygote',
      '--single-process',
    ],
    headless: true,
  },
});

let qrCodeData = null;

// Evento disparado quando o QR é gerado
client.on("qr", async (qr) => {
  console.log("✅ QR Code gerado!");
  qrCodeData = await qrcode.toDataURL(qr);
});

// Quando o cliente estiver pronto
client.on("ready", () => {
  console.log("🎉 WhatsApp conectado e pronto para uso!");
});

// Inicializa o cliente
client.initialize();

// Rota para visualizar o QR Code
app.get("/qr", (req, res) => {
  if (!qrCodeData) {
    return res.status(200).send("<h2>⏳ Gerando QR Code, aguarde...</h2>");
  }
  res.send(`
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column">
      <h2>Escaneie o QR Code abaixo no seu WhatsApp 📱</h2>
      <img src="${qrCodeData}" style="width:300px;"/>
    </div>
  `);
});

// Rota de teste
app.get("/", (req, res) => {
  res.send("✅ Servidor WhatsApp Web ativo!");
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
