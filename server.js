const express = require("express");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(bodyParser.json());

// 🔹 Variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "08182812";

// 🔹 Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Endpoint de verificação do Webhook (Facebook/WhatsApp)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ✅ Endpoint para receber mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from; // número do usuário
      const text = message.text?.body || null;
      const timestamp = message.timestamp;

      console.log(`📩 Nova mensagem recebida: ${from} - ${text}`);

      const { error } = await supabase
        .from("messages")
        .insert([{ from_number: from, message_text: text, timestamp }]);

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error);
      } else {
        console.log("✅ Mensagem salva no Supabase!");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// ✅ Novo endpoint para CONSULTAR mensagens salvas
app.get("/messages", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

// 🔹 Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
