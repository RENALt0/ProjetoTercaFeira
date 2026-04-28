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
      [descricao, valorNumerico, tipo, categoria, id, metodo_pagamento, observacao]
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

    const resultado = await pool.query(
      `SELECT * FROM transacoes
       WHERE data BETWEEN $1 AND $2
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


// LIGA O SERVIDOR (SEMPRE POR ÚLTIMO)
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});