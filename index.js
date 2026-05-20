import express from 'express';
import cors from 'cors'; //
import dotenv from 'dotenv';

import transacoesRoutes from './routes/transacoes.js';
import dashboardRoutes from './routes/dashboard.js';
import chatRoutes from './routes/chat.js';

// Carrega variáveis de ambiente do arquivo .env, se existir
dotenv.config();


const app = express(); //cria o servidor (sistema que pode receber requisições)

app.use(cors()); //permite que o frontend acesse o backend mesmo estando em portas diferentes
app.use(express.json()); //pega o json que chega e transforma em um objeto java script
app.use(express.static("Frontend")); // serve arquivos estáticos do frontend pela mesma origem
app.use(transacoesRoutes); // usa as rotas de transações definidas em routes/transacoes.js                  
app.use(dashboardRoutes); // usa as rotas do dashboard definidas em routes/dashboard.js
app.use(chatRoutes); // usa as rotas do chat definidas em routes/chat.js


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Servidor rodando na porta http://localhost:3000'));