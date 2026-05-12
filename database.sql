DROP TABLE IF EXISTS transacoes;

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    metodo_pagamento VARCHAR(20)
      CHECK (metodo_pagamento IN ('pix', 'cartao', 'dinheiro')),
    observacao TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
