import express from 'express';
import pool from '../db.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();

const getApiKey = () => {
  const envKey = process.env.GOOGLE_API_KEY;
  if (envKey && envKey.trim() !== "" && !envKey.includes("Chave Api") && !envKey.includes("Insira_Sua_Chave")) {
    return { key: envKey, source: 'ambiente (.env)' };
  }
  // Fallback: Chave de API codificada (Base64) para funcionar diretamente em qualquer máquina (ex: faculdade)
  try {
    const encoded = "QVEuQWI4Uk42SlRxcVRMdkJnekVhbDlfU2V6UnhHdkhha2xIeGo5VWs4bUE0czRuQ3pWUVE=";
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return { key: decoded, source: 'fallback interno de desenvolvimento' };
  } catch (e) {
    return { key: null, source: 'nenhum' };
  }
};

const apiConfig = getApiKey();
const apiKey = apiConfig.key;
let genAI = null;

if (!apiKey) {
  console.warn('\x1b[33m%s\x1b[0m', 'Aviso: Nenhuma chave GOOGLE_API_KEY configurada. O chat de IA estará desativado.');
} else {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('\x1b[32m%s\x1b[0m', `Google Generative AI inicializado com sucesso via ${apiConfig.source}.`);
  } catch (err) {
    console.error('Erro ao inicializar GoogleGenerativeAI:', err);
  }
}


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
    if (!genAI) {
      return res.json({
        resposta: `⚠️ **Assistente de IA Desativado**\n\nA chave de API do Google Generative AI não foi configurada ou é inválida no arquivo \`.env\`.\n\nPara habilitar respostas com IA:\n1. Adicione a sua chave no arquivo \`.env\` como: \`GOOGLE_API_KEY=sua_chave_real\`\n2. Reinicie o servidor Docker/Backend.\n\n*Nota: Se você perguntar pelo seu "saldo" (ex: "Qual é o meu saldo?"), as consultas locais continuam funcionando normalmente sem a chave!*`
      });
    }

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

  if (!apiKey) {
    return res.status(400).json({
      erro: 'A chave de API GOOGLE_API_KEY não está configurada.'
    });
  }

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