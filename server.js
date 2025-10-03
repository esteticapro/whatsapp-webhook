import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(bodyParser.json());

// 🔑 Configuração fixa do Supabase
const supabase = createClient(
  "https://narovlrntgnzoadoelst.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcm92bHJudGduem9hZG9lbHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzU5NTgsImV4cCI6MjA3NTAxMTk1OH0.hUNgxHdiFfIdisMDVA6bPfW_hHfMTgpSaJ81oMykGlI"
);

// ✅ rota de teste
app.get("/", (req, res) => {
  res.send("🚀 Webhook do WhatsApp conectado com Supabase (tabela leads)!");
});

// ✅ webhook do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.leaads?.[0];

    if (message) {
      const from = leads.from; // número do usuário
      const text = leads.text?.body || "Mensagem sem texto";

      console.log("📩 Nova mensagem recebida:", from, text);

      // 👉 salva na tabela leads
      const { error } = await supabase
        .from("leads")
        .insert([
          { 
            sender: from, 
            message: text, 
            created_at: new Date() 
          }
        ]);

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error);
      } else {
        console.log("✅ Mensagem salva em leads!");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// 🚀 inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
