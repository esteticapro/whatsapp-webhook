import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import qrcode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Para desenvolvimento. Em produção, restrinja ao seu domínio.
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- Isso pode ajudar em ambientes com poucos recursos
      '--disable-gpu'
    ],
  },
});

let qrCodeData = null;

app.get('/', (req, res) => {
  res.send('Servidor WhatsApp está rodando!');
});

app.get('/qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR Code não gerado ou WhatsApp já conectado.' });
  }
});

client.on('qr', async (qr) => {
  console.log('QR Code gerado! Aguardando leitura...');
  try {
    qrCodeData = await qrcode.toDataURL(qr);
    io.emit('message', 'QR Code gerado! Escaneie com seu celular.');
  } catch (err) {
    console.error('Falha ao gerar QR Code:', err);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
  qrCodeData = null; // Limpa o QR Code após conectar
  io.emit('whatsapp-connected');
});

client.on('auth_failure', msg => {
  console.error('Falha na autenticação!', msg);
  io.emit('message', 'Falha na autenticação. Tente novamente.');
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp foi desconectado!', reason);
  io.emit('whatsapp-disconnected');
  client.initialize(); // Tenta reinicializar para gerar um novo QR Code
});

io.on('connection', (socket) => {
  console.log('Frontend conectado via Socket.IO');
  
  // Se já estiver conectado, avisa o frontend
  client.getState().then(state => {
    if (state === 'CONNECTED') {
      socket.emit('whatsapp-connected');
    }
  });

  socket.on('logout', () => {
    client.logout().then(() => {
        console.log('Logout realizado.');
    });
  });
});

client.initialize();

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
