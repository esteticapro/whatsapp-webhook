import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Rota para salvar lead + mensagem
app.post("/webhook", async (req, res) => {
  try {
    const { phone, message } = req.body;

    console.log("📩 Nova mensagem recebida:", phone, message);

    // --- salvar LEAD ---
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert([
        {
          user_id: null, // se tiver o user_id, você passa aqui
          email: "desconhecido", // se conseguir extrair de algum lugar
          status: "contato"
        }
      ])
      .select()
      .single();

    if (leadError) {
      console.error("❌ Erro ao salvar lead:", leadError);
      return res.status(500).json({ error: leadError.message });
    }

    console.log("✅ Lead salvo:", lead);

    // --- salvar MENSAGEM ---
    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert([
        {
          position: 0,
          company: "sf",
          message: message || "sem mensagem",
          phone: phone || "desconhecido"
        }
      ])
      .select()
      .single();

    if (msgError) {
      console.error("❌ Erro ao salvar mensagem:", msgError);
      return res.status(500).json({ error: msgError.message });
    }

    console.log("✅ Mensagem salva:", msg);

    return res.status(200).json({ success: true, lead, msg });
  } catch (err) {
    console.error("🔥 Erro no servidor:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
