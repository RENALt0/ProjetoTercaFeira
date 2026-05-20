import express from 'express';
import pool from '../db.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Erro: variável de ambiente GOOGLE_API_KEY não encontrada. Defina a chave no seu arquivo .env ou nas variáveis de ambiente do serviço.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);


// ENDPOINT: CHAT IA
router.post("/chat", async (req, res) => {

  try {

    const { pergunta } = req.body;

    // =========================
    // BUSCA DADOS FINANCEIROS
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

    const categoriaResult = await pool.query(`
      SELECT categoria, SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY categoria
      ORDER BY total DESC
      LIMIT 1
    `);

    const entradas =
      Number(entradasResult.rows[0].total) || 0;

    const saidas =
      Number(saidasResult.rows[0].total) || 0;

    const saldo = entradas - saidas;

    const percentualGasto =
      entradas > 0
        ? ((saidas / entradas) * 100).toFixed(1)
        : 0;

    const categoriaTop = categoriaResult.rows[0];

    const perguntaLower =
      pergunta.toLowerCase();

    // RESPOSTAS LOCAIS

    if (perguntaLower.includes("saldo")) {

      return res.json({
        resposta: `
## Seu saldo atual

💰 Entradas: R$ ${entradas}

💸 Saídas: R$ ${saidas}

📊 Saldo final: R$ ${saldo}
`
      });
    }

    // IA

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const contexto = `
Você é um assistente financeiro.

Entradas: ${entradas}
Saídas: ${saidas}
Saldo: ${saldo}
`;

    const prompt = `
${contexto}

Pergunta:
${pergunta}
`;

    const result =
      await model.generateContent(prompt);

    const resposta =
      result.response.text();

    return res.json({
      resposta
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      erro: "Erro no chat"
    });
  }
});


// ENDPOINT: MODELS
router.get('/models', async (req, res) => {

  try {

    const baseUrl =
      'https://generativelanguage.googleapis.com';

    const url =
      `${baseUrl}/v1/models`;

    const fetchRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    });

    const json = await fetchRes.json();

    return res.json(json);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      erro: 'Não foi possível listar modelos'
    });
  }
});



export default router;