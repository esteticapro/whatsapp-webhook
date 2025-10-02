import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(bodyParser.json());

// 🔑 Use variáveis de ambiente (Render → Environment → Add)
// Coloque essas duas:
// SUPABASE_URL=https://narovlrntgnzoadoelst.supabase.co
// SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não configurados.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 Rota de webhook para mensagens recebidas
app.post("/webhook", async (req, res) => {
  try {
    const from = req.body.from || "desconhecido";
    const text = req.body.text || "";

    console.log("💬 Nova mensagem recebida:", from, text);

    // Salva no Supabase
    const { error } = await supabase
      .from("messages")
      .insert([{ from_number: from, message_text: text }]);

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
      return res.status(500).json({ error: "Erro ao salvar no Supabase" });
    }

    console.log("✅ Mensagem salva com sucesso!");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 Erro no webhook:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Porta dinâmica do Render ou 10000 local
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
