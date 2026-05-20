import express from 'express';
import pool from '../db.js';
import { validarTransacao } from '../utils/validacoes.js';

const router = express.Router();

/*GET e POST são métodos HTTP fundamentais para troca de dados cliente-servidor. 
GET recupera informações, anexando parâmetros na URL (limitado, visível, cacheável). 
POST envia dados para processamento no corpo da requisição (seguro para dados sensíveis, 
sem limite de tamanho, não cacheável). 
Use GET para buscas/leituras e POST para cadastros/logins.
*/

// ROTA: GET /transacoes
router.get("/transacoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transacoes ORDER BY data DESC');
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar transações" });
  }
});

// ROTA: POST /transacoes
router.post("/transacoes", async (req, res) => {

  // pega os dados do body
  const { descricao, valor, tipo, categoria, metodo_pagamento, observacao } = req.body;

  // usa função auxiliar
  const erroValidacao = validarTransacao(descricao, valor, tipo);

  if (erroValidacao) {
    return res.status(400).json({
      erro: erroValidacao
    });
  }

  // valida categoria
  if (!categoria || categoria.trim() === "") {
    return res.status(400).json({
      erro: "Categoria é obrigatória"
    });
  }

  // converte valor
  const valorNumerico = Number(valor);

  try {
    const result = await pool.query(
      `INSERT INTO transacoes (
        descricao,
        valor,
        tipo,
        categoria,
        metodo_pagamento,
        observacao
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        descricao,
        valorNumerico,
        tipo,
        categoria,
        metodo_pagamento,
        observacao
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao salvar transação"
    });
  }
});

// ROTA: DELETE /transacoes/:id
router.delete("/transacoes/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      erro: "ID inválido"
    });
  }

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

// ROTA: PUT /transacoes/:id
router.put("/transacoes/:id", async (req, res) => {

  const { id } = req.params;
  if (isNaN(Number(id))) {
    return res.status(400).json({
      erro: "ID inválido"
   });
  }

  const { descricao, valor, tipo, categoria, metodo_pagamento, observacao } = req.body;

  // usa função auxiliar
  const erroValidacao = validarTransacao(descricao, valor, tipo);

  if (erroValidacao) {
    return res.status(400).json({
      erro: erroValidacao
    });
  }

  // valida categoria
  if (!categoria || categoria.trim() === "") {
    return res.status(400).json({
      erro: "Categoria é obrigatória"
    });
  }

  // converte valor
  const valorNumerico = Number(valor);

  try {
    const result = await pool.query(
  `UPDATE transacoes
   SET descricao = $1,
       valor = $2,
       tipo = $3,
       categoria = $4,
       metodo_pagamento = $5,
       observacao = $6
   WHERE id = $7
   RETURNING *`,
  [
    descricao,
    valorNumerico,
    tipo,
    categoria,
    metodo_pagamento,
    observacao,
    id
  ]
);

    // verifica se existe
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

//Função nova: "Filtro período" - Retorna as transações por período de data
router.get("/transacoes/periodo", async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
     return res.status(400).json({
       erro: "dataInicio e dataFim são obrigatórios"
      });
    }

    const resultado = await pool.query(
      `SELECT * FROM transacoes
       WHERE data::date BETWEEN $1::date AND $2::date
       ORDER BY data DESC`,
      [dataInicio, dataFim] //Lembrar de atribuir variaveis no front
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar transações por período" });
  }
});

//Função nova: "Filtro Categoria" - Retorna as transações por categoria
router.get("/transacoes/categoria", async (req, res) => {
  try {
    const { categoria } = req.query;

    if (!categoria) {
      return res.status(400).json({
        erro: "Categoria é obrigatória"
      });
    }

    const resultado = await pool.query(
      `SELECT * FROM transacoes
       WHERE categoria ILIKE $1
       ORDER BY data DESC`,
      [`%${categoria}%`]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar por categoria" });
  }
});

//Função nova: "Filtro tipo" - Retorna as transações por tipo (entrada ou saida)
router.get("/transacoes/tipo", async (req, res) => {
  try {
    const { tipo } = req.query;

    if (tipo !== "entrada" && tipo !== "saida") {
     return res.status(400).json({
       erro: "Tipo deve ser 'entrada' ou 'saida'"
      });
    }

    const resultado = await pool.query(
      `SELECT * FROM transacoes
       WHERE tipo = $1
       ORDER BY data DESC`,
      [tipo]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar por tipo" });
  }
});

//Função nova: "Filtro valor" - Retorna as transações por valor faixa de valor
router.get("/transacoes/valor", async (req, res) => {
  try {
    const { min, max } = req.query;

    

    if (min === undefined || max === undefined) {
      return res.status(400).json({
        erro: "min e max são obrigatórios"
      });
    }

    if (isNaN(Number(min)) || isNaN(Number(max))) {
     return res.status(400).json({
        erro: "min e max devem ser números"
      });
    }


    const resultado = await pool.query(
      `SELECT * FROM transacoes
       WHERE valor BETWEEN $1 AND $2
       ORDER BY valor DESC`,
      [min, max]
    );
     
    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar por valor" });
  }
});


export default router;
