const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

io.on("connection", (socket) => {
  console.log("🌐 Frontend conectado!");

  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "📱 Escaneie o QR Code com seu WhatsApp");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "✅ WhatsApp conectado com sucesso!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "🔐 Autenticado com sucesso!");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", `❌ Desconectado: ${reason}`);
    client.initialize();
  });
});

client.initialize();

server.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));
