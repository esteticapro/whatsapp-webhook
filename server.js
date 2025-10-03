import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(bodyParser.json());

const supabaseUrl = "https://narovlrntgnzoadoelst.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcm92bHJudGduem9hZG9lbHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzU5NTgsImV4cCI6MjA3NTAxMTk1OH0.hUNgxHdiFfIdisMDVA6bPfW_hHfMTgpSaJ81oMykGlI";

const supabase = createClient(supabaseUrl, supabaseKey);

// Webhook de mensagens recebidas
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    // Extrair dados da mensagem
    const sender = body?.messages?.[0]?.from || "desconhecido";
    const message = body?.messages?.[0]?.text?.body || "sem mensagem";

    console.log("Nova mensagem recebida:", sender, message);

    // Inserir na tabela leads
    const { error } = await supabase
      .from("leads")
      .insert([
        {
          sender: sender,
          message: message,
          company: "sf",       // fixo ou dinâmico
          status: "contato",   // pode ser "novo", "contato", etc.
          position: 0,
        },
      ]);

    if (error) {
      console.error("Erro ao salvar no Supabase:", error);
      return res.status(400).send("Erro ao salvar no Supabase");
    }

    res.send("Mensagem salva com sucesso em leads!");
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.status(500).send("Erro interno do servidor");
  }
});

app.listen(10000, () => {
  console.log("Servidor rodando na porta 10000 🚀");
});
