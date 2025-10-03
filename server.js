import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = process.env.PORT || 3000;

// Configurações do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(bodyParser.json());

// Endpoint para salvar lead
app.post("/leads", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validação básica
    if (!name) {
      return res.status(400).json({ error: "O campo 'name' é obrigatório." });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          email: email || null,
          phone: phone || null,
          message: message || null,
        },
      ])
      .select();

    if (error) {
      console.error("Erro ao salvar no Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, lead: data[0] });
  } catch (err) {
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota simples para testar servidor
app.get("/", (req, res) => {
  res.send("🚀 API de Leads rodando com sucesso!");
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});
