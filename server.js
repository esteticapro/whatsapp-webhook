import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Para desenvolvimento. Em produção, restrinja ao seu domínio.
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Usando LocalAuth para persistir a sessão
// Isso criará uma pasta .wwebjs_auth para salvar os dados da sessão
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
      '--single-process',
      '--disable-gpu'
    ],
  },
});

let qrCodeDataUrl = null;
let isClientReady = false;

app.get('/', (req, res) => {
  res.send('Servidor WhatsApp está rodando!');
});

// Rota para o frontend buscar o QR Code se perder o evento do socket
app.get('/qr', (req, res) => {
  if (qrCodeDataUrl && !isClientReady) {
    res.json({ qr: qrCodeDataUrl });
  } else {
    res.status(404).json({ error: 'QR Code não disponível ou WhatsApp já conectado.' });
  }
});

// Evento gerado quando um novo QR Code é necessário
client.on('qr', async (qr) => {
  console.log('QR Code gerado! Aguardando leitura...');
  isClientReady = false;
  try {
    qrCodeDataUrl = await qrcode.toDataURL(qr);
    io.emit('qr', qrCodeDataUrl); // Envia o QR Code para o frontend
    io.emit('message', 'QR Code gerado! Escaneie com seu celular.');
  } catch (err) {
    console.error('Falha ao gerar QR Code:', err);
  }
});

// Evento disparado quando o cliente está pronto e conectado!
client.on('ready', () => {
  console.log('✅ WhatsApp conectado e pronto!');
  isClientReady = true;
  qrCodeDataUrl = null; // Limpa o QR Code após conectar
  io.emit('ready'); // Avisa o frontend que está conectado
  io.emit('message', 'WhatsApp conectado com sucesso!');
});

// Evento disparado quando a autenticação é concluída (útil para sessões salvas)
client.on('authenticated', () => {
    console.log('🔒 Sessão autenticada!');
    isClientReady = true;
    io.emit('authenticated'); // Avisa o frontend que a sessão foi restaurada
});

client.on('auth_failure', msg => {
  console.error('Falha na autenticação!', msg);
  io.emit('message', 'Falha na autenticação. Gerando novo QR Code...');
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp foi desconectado!', reason);
  isClientReady = false;
  io.emit('disconnected');
  // O cliente tentará se reconectar ou gerar um novo QR Code se necessário
  client.initialize();
});

io.on('connection', (socket) => {
  console.log('Frontend conectado via Socket.IO');
  
  // Se o cliente já estiver pronto, avisa o frontend imediatamente
  if (isClientReady) {
    socket.emit('ready');
  } else if (qrCodeDataUrl) {
    // Se houver um QR Code esperando, envia para o novo cliente conectado
    socket.emit('qr', qrCodeDataUrl);
  }

  socket.on('logout', async () => {
    console.log('Recebido pedido de logout...');
    await client.logout();
    console.log('Logout realizado.');
    isClientReady = false;
    qrCodeDataUrl = null;
  });
});

client.initialize();

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
