import express from 'express';
import pkg from 'pg';

const { Pool } = pkg; //vai linkar com o banco de dados
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'controle_financeiro', 
  password: '0666',
  port: 5432,
});    //cria a conexão

pool.connect() //teste de conexão com o banco
  .then(() => console.log("Conectado ao PostgreSQL"))
  .catch(err => console.error("Erro ao conectar:", err));
const app = express(); //cria o servidor (sistema que pode receber requisições)

app.use(express.json()); //pega o json que chega e transforma em um objeto java script
                        
//GET e POST são métodos HTTP fundamentais para troca de dados cliente-servidor. GET recupera informações, anexando parâmetros na URL (limitado, visível, cacheável). POST envia dados para processamento no corpo da requisição (seguro para dados sensíveis, sem limite de tamanho, não cacheável). Use GET para buscas/leituras e POST para cadastros/logins.

// ROTAS
app.get("/transacoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transacoes');
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar transações" });
  }
});

app.post("/transacoes", async (req, res) => {

  //  PRIMEIRA COISA: pegar os dados do body
  const { descricao, valor, tipo } = req.body;

  //  DEPOIS vem as validações
  if (!descricao || descricao.trim() === "" || valor === undefined || !tipo) {
    return res.status(400).json({
      erro: "Descrição, valor e tipo são obrigatórios"
    });
  }

  if (typeof valor !== "number") {
    return res.status(400).json({
      erro: "Valor deve ser um número"
    });
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    return res.status(400).json({
      erro: "Tipo deve ser 'entrada' ou 'saida'"
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO transacoes (descricao, valor, tipo) VALUES ($1, $2, $3) RETURNING *',
      [descricao, valor, tipo]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao salvar transação" });
  }
});

// LIGA O SERVIDOR (SEMPRE POR ÚLTIMO)
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});