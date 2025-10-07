const express = require('express');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeImage = null;
let isReady = false;

// Inicializa o cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

// Evento quando o QR Code é gerado
client.on('qr', async (qr) => {
  qrCodeImage = await qrcode.toDataURL(qr);
  isReady = false;
  console.log('🟡 QR Code gerado. Aguardando leitura...');
});

// Evento quando o WhatsApp é autenticado e pronto
client.on('ready', () => {
  isReady = true;
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.initialize();

// Rota principal
app.get('/', (req, res) => {
  if (isReady) {
    res.send(`
      <html>
        <head><title>WhatsApp Conectado ✅</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ WhatsApp conectado com sucesso!</h1>
          <p>O bot está pronto para uso.</p>
        </body>
      </html>
    `);
  } else if (qrCodeImage) {
    res.send(`
      <html>
        <head><title>Escaneie o QR Code</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>📱 Escaneie o QR Code abaixo para conectar o WhatsApp:</h1>
          <img src="${qrCodeImage}" style="width:300px; height:300px;" />
          <p>Abra o WhatsApp > Dispositivos Conectados > Conectar um novo dispositivo</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <head><title>Aguardando QR</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏳ Gerando QR Code...</h1>
          <p>Aguarde alguns segundos e atualize a página.</p>
        </body>
      </html>
    `);
  }
});

// Inicializa servidor web
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
