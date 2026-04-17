DROP TABLE IF EXISTS transacoes;

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- dados iniciais (opcional)
INSERT INTO transacoes (descricao, valor, tipo)
VALUES 
('Salário', 3000, 'entrada'),
('Mercado', 200, 'saida');
