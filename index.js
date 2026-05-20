import express from 'express';
import pool from './db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";  //Importa a biblioteca de IA generativa do Google

// Carrega variáveis de ambiente do arquivo .env, se existir
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Erro: variável de ambiente GOOGLE_API_KEY não encontrada. Defina a chave no seu arquivo .env ou nas variáveis de ambiente do serviço.');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

const app = express(); //cria o servidor (sistema que pode receber requisições)
app.use(cors()); //permite que o frontend acesse o backend mesmo estando em portas diferentes
app.use(express.json()); //pega o json que chega e transforma em um objeto java script
app.use(express.static("Frontend")); // serve arquivos estáticos do frontend pela mesma origem
                        
/*GET e POST são métodos HTTP fundamentais para troca de dados cliente-servidor. 
GET recupera informações, anexando parâmetros na URL (limitado, visível, cacheável). 
POST envia dados para processamento no corpo da requisição (seguro para dados sensíveis, 
sem limite de tamanho, não cacheável). 
Use GET para buscas/leituras e POST para cadastros/logins.
*/



// FUNÇÃO AUXILIAR: VALIDAR DADOS DE TRANSAÇÃO
// Evita repetir validações no POST e PUT
function validarTransacao(descricao, valor, tipo) {

  // Verifica campos vazios
  if (!descricao || descricao.trim() === "" || valor === undefined || !tipo) {
    return "Descrição, valor e tipo são obrigatórios";
  }

  // Verifica tipo permitido
  if (tipo !== "entrada" && tipo !== "saida") {
    return "Tipo deve ser 'entrada' ou 'saida'";
  }

  // Converte valor para número
  const valorNumerico = Number(valor);
  
  // Verifica se é negativo
  if (valorNumerico < 0) {
    return "Valor não pode ser negativo";
  }
  
  // Verifica se é número válido
  if (isNaN(valorNumerico)) {
    return "Valor inválido";
  }

  // Se tudo estiver certo, retorna null
  return null;
}

//Funções Pincipais:

//Função
app.get("/transacoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transacoes ORDER BY data DESC');
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar transações" });
  }
});

//Função: "Transacoes" - Insere as transações no banco de dados
app.post("/transacoes", async (req, res) => {

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

//Função nova: "Delete" - Corrige possiveis erros e remove testes
app.delete("/transacoes/:id", async (req, res) => {
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

//Função nova: Update(PUT) - Atualiza os dados do banco, baseados pelo ID
app.put("/transacoes/:id", async (req, res) => {

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


//Função nova: "Gasto por categoria" - Seleciona e soma os gastos por categoria.
app.get("/gasto-categoria", async (req, res) => {
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

//Função nova: "Media mensal" - Calcula a média de gastos mensais
app.get("/media-mensal", async (req, res) => {
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

//Função nova: "Maior gasto" - Seleciona o maior gasto registrado
app.get("/maior-gasto", async (req, res) => {
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
app.get("/menor-gasto", async (req, res) => {
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

//Função nova: "Variacao mensal" - Calcula a variação entre os meses
app.get("/variacao-mensal", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        DATE_TRUNC('month', data) AS mes,
        SUM(valor) AS total
      FROM transacoes
      WHERE tipo = 'saida'
      GROUP BY mes
      ORDER BY mes
    `);

    //Cria uma variavel "mes" para receber o valor total de cada mes
    const dados = resultado.rows.map(row => ({
      mes: row.mes,
      total: Number(row.total)
    }));

    const variacoes = [];

    //Cria um loop que calcula a diferença entre um mes e o anterior
    for (let i = 1; i < dados.length; i++) {
      variacoes.push({
        mes: dados[i].mes,
        variacao: dados[i].total - dados[i - 1].total
      });
    }

    res.json({
      dadosMensais: dados,
      variacoes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao calcular variação mensal" });
  }
});

//FILTROS:

//Função nova: "Filtro de periodo" - Retorna as transações por data
app.get("/transacoes/periodo", async (req, res) => {
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
app.get("/transacoes/categoria", async (req, res) => {
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
app.get("/transacoes/tipo", async (req, res) => {
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
app.get("/transacoes/valor", async (req, res) => {
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

// ENDPOINT: INSIGHTS FINANCEIROS
app.get("/insights", async (req, res) => {
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
app.get("/dashboard", async (req, res) => {
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


// ENDPOINT: CHAT IA
app.post("/chat", async (req, res) => {

  try {

    // =========================
    // PERGUNTA DO USUÁRIO
    // =========================

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

    // =========================
    // CONVERSÕES
    // =========================

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

    // =========================
    // MODELO GEMINI
    // =========================

    // Use um modelo compatível com a versão da API. Se o seu projeto
    // tiver acesso ao Gemini via essa biblioteca, ajuste aqui para o
    // modelo correto. Como fallback, usamos um modelo de texto compatível
    // com a API v1beta.
    // Seleciona um modelo disponível retornado pela API de modelos
    // Usa a versão estável da API (v1) para modelos mais recentes
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash"
    }, { apiVersion: "v1" });

    // =========================
    // CONTEXTO DA IA
    // =========================

    const contexto = `
Você é um assistente financeiro inteligente.

Seu papel é:
- responder dúvidas financeiras
- ajudar o usuário a entender suas finanças
- analisar os dados financeiros abaixo
- explicar conceitos financeiros de forma simples
- dar recomendações úteis
- responder de forma amigável e objetiva

Dados financeiros atuais do usuário:

Entradas totais: R$ ${entradas}
Saídas totais: R$ ${saidas}
Saldo atual: R$ ${saldo}
Percentual gasto da renda: ${percentualGasto}%

Categoria com maior gasto:
${categoriaTop?.categoria || "Nenhuma"}

Valor gasto na principal categoria:
R$ ${categoriaTop?.total || 0}

IMPORTANTE:
- Responda em português brasileiro.
- Responda de forma organizada.
- Use parágrafos curtos.
- Quando fizer recomendações, use tópicos.
- Responda como um assistente financeiro de aplicativo moderno.
- Evite respostas longas demais.
- Seja conversacional.
- Não escreva relatórios extensos.
- Priorize clareza visual.
- Não invente dados inexistentes.
- Se o usuário fizer perguntas gerais sobre finanças, responda normalmente.
- Se o usuário perguntar sobre os próprios dados financeiros, use os dados acima.
`;

    // =========================
    // PROMPT FINAL
    // =========================

    const prompt = `
${contexto}

Pergunta do usuário:
"${pergunta}"
`;

    // =========================
    // RESPOSTA GEMINI
    // =========================

    console.log("Enviando prompt para o modelo generativo...");

    let resposta = "";

    try {
      const result = await model.generateContent(prompt);
      console.log("Resposta recebida:", result);
      resposta = result?.response?.text?.() || "";
      console.log("Texto extraído:", resposta);
    } catch (errModel) {
      // Log detalhado para diagnóstico
      const modelErr = {
        message: errModel?.message,
        status: errModel?.status,
        statusText: errModel?.statusText,
        details: errModel?.errorDetails
      };
      console.error("Erro ao chamar modelo generativo:", modelErr);

      // Fallback amigável usando os dados financeiros já disponíveis
      resposta = `Desculpe, não foi possível acessar o serviço de IA no momento.\n\nResumo rápido:\n- **Entradas:** R$ ${entradas}\n- **Saídas:** R$ ${saidas}\n- **Saldo:** R$ ${saldo}\n\nTente novamente daqui a alguns minutos.`;
    }

    // =========================
    // RESPOSTA FINAL
    // =========================

    res.json({
      resposta
    });

  } catch (error) {

    console.error("ERRO NO CHAT IA:", error);

    res.status(500).json({
      erro: "Erro no chat IA",
      detalhes: error.message
    });
  }
});


// ENDPOINT: LISTAR MODELOS DISPONÍVEIS (auxiliar para debug/config)
app.get('/models', async (req, res) => {
  try {
    const baseUrl = 'https://generativelanguage.googleapis.com';
    // Tenta a versão estável v1 para listagem de modelos
    const url = `${baseUrl}/v1/models`;

    const fetchRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': genAI.apiKey || ''
      }
    });

    const json = await fetchRes.json();
    return res.json(json);
  } catch (err) {
    console.error('Erro ao listar modelos:', err);
    return res.status(500).json({ erro: 'Não foi possível listar modelos', detalhes: err.message });
  }
});


// LIGA O SERVIDOR (SEMPRE POR ÚLTIMO)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta http://localhost:3000'));