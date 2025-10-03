const express = require("express");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(bodyParser.json());

// 🔑 Variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "08182812"; // seu token do Meta

// 🚀 Log inicial para debug
console.log("🚀 Iniciando servidor...");
console.log("🔑 Supabase URL:", SUPABASE_URL ? "OK" : "Faltando");
console.log("🔑 Supabase KEY:", SUPABASE_KEY ? "OK" : "Faltando");

// 📦 Conexão com Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 📌 Rota de verificação do webhook (Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado ✅");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📌 Rota para receber mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  console.log("📩 Recebido webhook:", JSON.stringify(req.body, null, 2));

  try {
    if (
      req.body.object &&
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0].value.messages
    ) {
      const message = req.body.entry[0].changes[0].value.messages[0];
      const from = message.from; // número do usuário
      const text = message.text ? message.text.body : null;

      console.log("👤 Número:", from);
      console.log("💬 Mensagem:", text);

      // 👉 Inserir no Supabase (tabela leads)
      const { error } = await supabase.from("leads").insert([
        {
          phone: from,
          message: text,
        },
      ]);

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error);
      } else {
        console.log("✅ Mensagem salva no Supabase");
      }
    }
  } catch (err) {
    console.error("❌ Erro no processamento:", err);
  }

  res.sendStatus(200);
});

// 📌 Rota padrão
app.get("/", (req, res) => {
  res.send("🚀 API rodando com sucesso!");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
