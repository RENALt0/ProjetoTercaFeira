import express from 'express';

const app = express();

app.use(express.json()); //permite receber dados (POST)

app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});

let transacoes = []; //banco de dados temporário (vai guardar gastos de memória)

app.post("/transacoes", (req, res) => {    //Rota para LISTAR gastos, req = request e res = response
  const { descricao, valor } = req.body;

  const novaTransacao = {
    id: transacoes.length + 1,
    descricao,
    valor,
  };

  transacoes.push(novaTransacao);

  res.status(201).json(novaTransacao);
});

app.get("/transacoes", (req, res) => {   //Rota para LISTAR gastos
	res.json(transacoes);
}); 