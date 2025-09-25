import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Configuração do banco
const db = await mysql.createPool({
  host: "212.85.3.22", // troque se for outro servidor
  user: "u134097042_cafeexpedicao", // seu usuário MySQL
  password: "cafeExpedicao25%", // sua senha MySQL
  database: "u134097042_cafe", // nome do banco criado
});

// 🔹 Rota para registrar novo item
app.post("/registro", async (req, res) => {
  try {
    const { nome, item } = req.body;
    if (!nome || !item) {
      return res.status(400).json({ error: "Nome e item são obrigatórios" });
    }

    const data = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
    await db.query(
      "INSERT INTO registros (nome, item, data) VALUES (?, ?, ?)",
      [nome, item, data]
    );

    res.json({ success: true, message: "Registro adicionado com sucesso!" });
  } catch (err) {
    console.error("Erro ao salvar registro:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🔹 Listar todos os registros
app.get("/registros", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM registros ORDER BY data DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar registros:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🔹 Dias sem trazer para uma pessoa específica
app.get("/dias/:nome", async (req, res) => {
  try {
    const { nome } = req.params;
    const [rows] = await db.query(
      "SELECT data FROM registros WHERE nome = ? ORDER BY data DESC LIMIT 1",
      [nome]
    );

    if (rows.length === 0) {
      return res.json({ nome, dias: "Nunca trouxe" });
    }

    const ultimaData = new Date(rows[0].data);
    const hoje = new Date();
    const diff = Math.floor(
      (hoje - ultimaData) / (1000 * 60 * 60 * 24) // diferença em dias
    );

    res.json({ nome, dias: diff });
  } catch (err) {
    console.error("Erro ao calcular dias:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🔹 Ranking - quem está há mais tempo sem trazer
app.get("/ranking", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT nome, 
             MAX(data) AS ultima_data,
             DATEDIFF(CURDATE(), MAX(data)) AS dias_sem_trazer
      FROM registros
      GROUP BY nome
      ORDER BY dias_sem_trazer DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao gerar ranking:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🔹 Start do servidor
app.listen(3000, () => {
  console.log("✅ API rodando em http://localhost:3000");
});
