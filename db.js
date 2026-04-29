import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'controle_financeiro',
  password: '0666',
  port: 5432,
});

// Teste de conexão
pool.connect()
  .then(() => console.log("Conectado ao PostgreSQL"))
  .catch(err => console.error("Erro ao conectar:", err));

export default pool;
