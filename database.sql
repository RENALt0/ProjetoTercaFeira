DROP TABLE IF EXISTS transacoes;

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    metodo_pagamento VARCHAR(20),
    observacao TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- dados iniciais (opcional)
INSERT INTO transacoes (descricao, categoria, valor, tipo, metodo_pagamento, observacao)
VALUES
('Salário', 'Renda', 3000, 'entrada', 'pix', 'Salário mensal'),
('Mercado', 'Alimentação', 200, 'saida', 'cartao', 'Compra inicial');