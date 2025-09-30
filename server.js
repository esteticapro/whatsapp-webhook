import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(bodyParser.json());

// 🔑 Conexão com Supabase usando variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Token de verificação do Meta Developer
const VERIFY_TOKEN = "08182812";

// ✅ Rota GET (verificação inicial do webhook no Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("🌍 Webhook verificado com sucesso!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Rota POST (receber mensagens do WhatsApp)
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      const contact = changes?.value?.contacts?.[0];

      if (message && contact) {
        const dataToSave = {
          from: message.from, // número do remetente
          to: contact.wa_id, // número de destino (seu número no sandbox)
          message: message.text ? message.text.body : "Mensagem de mídia",
          timestamp: new Date(
            parseInt(message.timestamp) * 1000
          ).toISOString(),
        };

        // Inserindo no Supabase
        const { error } = await supabase.from("todos").insert([dataToSave]);

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error);
          return res.status(500).send("Erro ao salvar no Supabase");
        }

        console.log("✅ Mensagem salva no Supabase:", dataToSave);
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// 🚀 Porta automática do Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
