import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import pkg from "@supabase/supabase-js";

const { createClient } = pkg;

const app = express();
app.use(bodyParser.json());

// 🔑 suas chaves Supabase
const SUPABASE_URL = "https://narovlrntgnzoadoelst.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcm92bHJudGduem9hZG9lbHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzU5NTgsImV4cCI6MjA3NTAxMTk1OH0.hUNgxHdiFfIdisMDVA6bPfW_hHfMTgpSaJ81oMykGlI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 📩 Webhook
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0]?.text?.body || null;
    const sender = value?.messages?.[0]?.from || null;

    if (!message || !sender) {
      console.log("Mensagem ou remetente não encontrados");
      return res.sendStatus(200);
    }

    console.log(`📩 Nova mensagem recebida: ${sender} ${message}`);

    // 👉 Salvar na tabela leads
    const { error } = await supabase.from("leads").insert([
      {
        sender: sender,
        message: message,
        company: "sf",
        status: "contato",
        position: 0,
        name: sender, // 👈 salvando número no campo name
      },
    ]);

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
    } else {
      console.log("✅ Lead salvo com sucesso!");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// 🚀 Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
