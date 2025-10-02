import express from "express";
import bodyParser from "body-parser";
import pkg from "@supabase/supabase-js";

const { createClient } = pkg;
const app = express();
app.use(bodyParser.json());

// 🔑 variáveis fixas (coloquei as suas direto aqui)
const VERIFY_TOKEN = "08182812";
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co"; // substitua pelo seu
const SUPABASE_KEY = "SEU-ANON-PUBLIC"; // substitua pelo seu

// Conexão com Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ rota GET (verificação do Webhook no Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ rota POST (mensagens recebidas)
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (message) {
        const from = message.from; // número do remetente
        const text = message.text?.body; // conteúdo da mensagem

        console.log("📩 Nova mensagem recebida:", from, text);

        // 🔽 salva no Supabase
        const { error } = await supabase.from("messages").insert([
          {
            from_number: from,
            message_text: text,
            timestamp: new Date().toISOString()
          }
        ]);

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error);
        } else {
          console.log("✅ Mensagem salva no Supabase!");
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
