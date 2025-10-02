import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import pkg from "@supabase/supabase-js";

const { createClient } = pkg;

// 🔹 Configurações
const app = express();
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Rota de verificação do Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ✅ Receber mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (message) {
        const from_number = message.from; // número do usuário
        const message_text = message.text?.body || "";
        const timestamp = new Date().toISOString();
        const wa_id = message.id;

        console.log("📩 Nova mensagem recebida:", from_number, message_text);

        // 🔹 Salvar na tabela messages
        const { error } = await supabase.from("messages").insert([
          {
            from_number,
            message_text,
            timestamp,
            wa_id
          }
        ]);

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error);
        } else {
          console.log("✅ Mensagem salva no Supabase!");
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
