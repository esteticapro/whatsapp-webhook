import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(express.json());

// Conexão com Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota simples para teste
app.get("/", (req, res) => {
  res.send("🚀 Servidor online e conectado!");
});

// Rota para buscar clientes
app.get("/clientes", async (req, res) => {
  try {
    const { data, error } = await supabase.from("clientes").select("*").order("id", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar clientes:", err.message);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Inicializa o servidor
app.listen(port, () => console.log(`✅ Servidor rodando na porta ${port}`));
