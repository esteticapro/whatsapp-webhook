import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import pkg from "@supabase/supabase-js";

const { createClient } = pkg;

const app = express();
app.use(bodyParser.json());

// 🔑 Configurações
const VERIFY_TOKEN = "08182812";
const SUPABASE_URL = "https://narovlrntgnzoadoelst.supabase.co";        // 🔽 coloque a URL aqui
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcm92bHJudGduem9hZG9lbHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzU5NTgsImV4cCI6MjA3NTAxMTk1OH0.hUNgxHdiFfIdisMDVA6bPfW_hHfMTgpSaJ81oMykGlI";  // 🔽 coloque a anon key aqui

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Verificação do Webhook (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// 📌 Receber mensagens do WhatsApp (POST)
app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook recebido:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object) {
    try {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from; // número do usuário
        const text = message.text ? message.text.body : "";

        console.log("💬 Nova mensagem recebida:", from, text);

        // 🔽 Salva no Supabase em "messages"
        const { error } = await supabase.from("messages").insert([
          {
            from_number: from,
            message_text: text,
            timestamp: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error);
        } else {
          console.log("✅ Mensagem salva no Supabase!");
        }
      }
    } catch (err) {
      console.error("❌ Erro no processamento:", err);
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
