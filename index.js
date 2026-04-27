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
// PRIMEIRA COISA: pegar os dados do body
  const { descricao, valor, tipo } = req.body;

  // validações básicas
  if (!descricao || descricao.trim() === "" || valor === undefined || !tipo) {
    return res.status(400).json({
      erro: "Descrição, valor e tipo são obrigatórios"
    });
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    return res.status(400).json({
      erro: "Tipo deve ser 'entrada' ou 'saida'"
    });
  }

  // AQUI verifica se o valor é válido
  const valorNumerico = Number(valor);

  if (isNaN(valorNumerico)) {
    return res.status(400).json({
      erro: "Valor inválido"
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO transacoes (descricao, valor, tipo) VALUES ($1, $2, $3) RETURNING *',
      [descricao, valorNumerico, tipo] // 👈 usa o convertido aqui
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao salvar transação" });
  }
});

//Função nova: "Resumo" - calcula o saldo de todas a entradas e saídas
app.get("/resumo", async (req, res) => {
  try {
    const entradas = await pool.query(
      "SELECT SUM(valor) FROM transacoes WHERE tipo = 'entrada'"
    );

    const saidas = await pool.query(
      "SELECT SUM(valor) FROM transacoes WHERE tipo = 'saida'"
    );

    const totalEntradas = Number(entradas.rows[0].sum) || 0;
    const totalSaidas = Number(saidas.rows[0].sum) || 0;

    const saldo = totalEntradas - totalSaidas;

    res.json({
      saldo,
      entradas: totalEntradas,
      saidas: totalSaidas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao gerar resumo" });
  }
});

//Função nova: "Delete" - Corrige possiveis erros e remove testes
app.delete("/transacoes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM transacoes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Transação não encontrada"
      });
    }

    res.json({
      mensagem: "Transação deletada com sucesso",
      transacao: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao deletar transação"
    });
  }
});

//Função nova: Update(PUT) - Atualiza os dados do banco, baseados pelo ID
app.put("/transacoes/:id", async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, tipo } = req.body;

  //  validações básicas
  if (!descricao || descricao.trim() === "" || valor === undefined || !tipo) {
    return res.status(400).json({
      erro: "Descrição, valor e tipo são obrigatórios"
    });
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    return res.status(400).json({
      erro: "Tipo deve ser 'entrada' ou 'saida'"
    });
  }

  // conversão do valor (igual ao POST)
  const valorNumerico = Number(valor);

  if (isNaN(valorNumerico)) {
    return res.status(400).json({
      erro: "Valor inválido"
    });
  }

  try {
    const result = await pool.query(
      `UPDATE transacoes
       SET descricao = $1, valor = $2, tipo = $3
       WHERE id = $4
       RETURNING *`,
      [descricao, valorNumerico, tipo, id]
    );

    // ESSENCIAL: verificar se existe
    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Transação não encontrada"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao atualizar transação"
    });
  }
});

// LIGA O SERVIDOR (SEMPRE POR ÚLTIMO)
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});