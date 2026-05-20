import express from 'express';
import pool from '../db.js';
import { validarTransacao } from '../utils/validacoes.js';

const router = express.Router();

// ROTA: GET /resumo
router.get("/resumo", async (req, res) => {
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


// ROTA: GET /gasto-categoria
router.get("/gasto-categoria", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT categoria, SUM(valor) as total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY categoria
      ORDER BY total DESC
    `);

    res.json({
      categorias: resultado.rows.map(row => ({
        categoria: row.categoria,
        total: Number(row.total)
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao calcular gastos por categoria" });
  }
});


// ROTA: GET /media-mensal
router.get("/media-mensal", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT AVG(total_mes) AS media
      FROM (
        SELECT DATE_TRUNC('month', data) AS mes,
               SUM(valor) AS total_mes
        FROM transacoes
        WHERE tipo = 'saida'
        GROUP BY mes
      ) sub
    `);

    const media = Number(resultado.rows[0].media) || 0;

    res.json({ mediaMensal: media });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao calcular média mensal" });
  }
});

// ROTA: GET /maior-gasto
router.get("/maior-gasto", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT * FROM transacoes
      WHERE tipo = 'saida'
      ORDER BY valor DESC
      LIMIT 1
    `);

    res.json(resultado.rows[0] || {});

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar maior gasto" });
  }
});

//Função nova: "Menor gasto" - Seleciona o menor gasto registrado
router.get("/menor-gasto", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT * FROM transacoes
      WHERE tipo = 'saida'
      ORDER BY valor ASC
      LIMIT 1
    `);

    res.json(resultado.rows[0] || {});

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar menor gasto" });
  }
});


// ENDPOINT: INSIGHTS FINANCEIROS
router.get("/insights", async (req, res) => {
  try {

    // =========================
    // BUSCA TOTAL DE ENTRADAS
    // =========================
    const entradasResult = await pool.query(`
      SELECT SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'entrada'
    `);

    // =========================
    // BUSCA TOTAL DE SAÍDAS
    // =========================
    const saidasResult = await pool.query(`
      SELECT SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
    `);

    // =========================
    // BUSCA CATEGORIA COM MAIOR GASTO
    // =========================
    const categoriaResult = await pool.query(`
      SELECT categoria, SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY categoria
      ORDER BY total DESC
      LIMIT 1
    `);

    // =========================
    // CONVERTE VALORES
    // =========================
    const entradas = Number(entradasResult.rows[0].total) || 0;
    const saidas = Number(saidasResult.rows[0].total) || 0;

    // saldo
    const saldo = entradas - saidas;

    // pega categoria principal
    const categoriaTop = categoriaResult.rows[0];

    // =========================
    // ARRAY DE INSIGHTS
    // =========================
    const insights = [];

    // insight saldo
    if (saldo < 0) {
      insights.push("Seu saldo está negativo.");
    } else if (saldo > 0) {
      insights.push("Seu saldo está positivo.");
    } else {
      insights.push("Seu saldo está zerado.");
    }

    // insight gastos
    if (saidas > entradas) {
      insights.push("Você está gastando mais do que ganha.");
    }

    // insight categoria principal
    if (categoriaTop) {
      insights.push(
        `Sua categoria com maior gasto é '${categoriaTop.categoria}' com R$ ${Number(categoriaTop.total).toFixed(2)}`
      );
    }

    // =========================
    // RESPOSTA FINAL
    // =========================
    res.json({
      saldo,
      entradas,
      saidas,
      insights
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao gerar insights"
    });
  }
});


// ENDPOINT: DASHBOARD COMPLETO
router.get("/dashboard", async (req, res) => {
  try {

    // =========================
    // RESUMO
    // =========================
    const entradasResult = await pool.query(`
      SELECT SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'entrada'
    `);

    const saidasResult = await pool.query(`
      SELECT SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
    `);

    const entradas = Number(entradasResult.rows[0].total) || 0;
    const saidas = Number(saidasResult.rows[0].total) || 0;
    const saldo = entradas - saidas;

    // =========================
    // MAIOR GASTO
    // =========================
    const maiorGastoResult = await pool.query(`
      SELECT *
      FROM transacoes
      WHERE tipo = 'saida'
      ORDER BY valor DESC
      LIMIT 1
    `);

    // =========================
    // MENOR GASTO
    // =========================
    const menorGastoResult = await pool.query(`
      SELECT *
      FROM transacoes
      WHERE tipo = 'saida'
      ORDER BY valor ASC
      LIMIT 1
    `);

    // =========================
    // GASTOS POR CATEGORIA
    // =========================
    const categoriasResult = await pool.query(`
      SELECT categoria, SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY categoria
      ORDER BY total DESC
    `);

    // =========================
    // VARIAÇÃO MENSAL
    // =========================
    const variacaoResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', data) AS mes,
        SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY mes
      ORDER BY mes
    `);

    // =========================
    // INSIGHTS
    // =========================
    const insights = [];

    if (saldo < 0) {
      insights.push("Seu saldo está negativo.");
    } else {
      insights.push("Seu saldo está positivo.");
    }

    if (saidas > entradas) {
      insights.push("Você está gastando mais do que ganha.");
    }

    const categoriaTop = categoriasResult.rows[0];

    if (categoriaTop) {
      insights.push(
        `Sua categoria com maior gasto é '${categoriaTop.categoria}'`
      );
    }

    // =========================
    // RESPOSTA FINAL
    // =========================
    res.json({
      resumo: {
        saldo,
        entradas,
        saidas
      },

      maiorGasto: maiorGastoResult.rows[0] || {},

      menorGasto: menorGastoResult.rows[0] || {},

      gastosPorCategoria: categoriasResult.rows.map(row => ({
        categoria: row.categoria,
        total: Number(row.total)
      })),

      variacaoMensal: variacaoResult.rows.map(row => ({
        mes: row.mes,
        total: Number(row.total)
      })),

      insights
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao carregar dashboard"
    });
  }
});
 




export default router;