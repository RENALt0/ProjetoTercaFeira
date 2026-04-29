#  Controle Financeiro API

##  Objetivo do Sistema

Sistema de API REST para gerenciamento e controle de transações financeiras. Permite criar, atualizar, deletar e consultar transações, além de gerar relatórios e análises financeiras detalhadas.

##  Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **pg** - Driver PostgreSQL para Node.js

##  Dependências

```json
{
  "express": "^5.2.1",
  "pg": "^8.20.0"
}
```

##  Como Instalar

1. **Clone o repositório:**
```bash
git clone <https://github.com/RENALt0/ProjetoTercaFeira.git>
cd ProjetoTercaFeira
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados PostgreSQL:**
   - Crie um banco de dados chamado `controle_financeiro`
   - Execute o arquivo `database.sql` para criar a tabela:
   ```bash
   psql -U postgres -d controle_financeiro -f database.sql
   ```

4. **Configure a conexão no `index.js`:**
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'controle_financeiro', 
  password: '0666',  // Altere conforme sua senha
  port: 5432,
});
```

##  Como Rodar

```bash
npm start
```

O servidor iniciará em: `http://localhost:3000`

Você verá as mensagens:
- `Servidor rodando em http://localhost:3000`
- `Conectado ao PostgreSQL`

##  Estrutura do Banco de Dados

### Tabela: `transacoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | Identificador único (chave primária) |
| `descricao` | TEXT | Descrição da transação |
| `categoria` | VARCHAR(50) | Categoria da transação |
| `valor` | NUMERIC(10,2) | Valor da transação |
| `tipo` | VARCHAR(10) | 'entrada' ou 'saida' |
| `metodo_pagamento` | VARCHAR(20) | 'pix', 'cartao' ou 'dinheiro' |
| `observacao` | TEXT | Observações adicionais |
| `data` | TIMESTAMP | Data/hora (padrão: atual) |

##  Endpoints Disponíveis

### 1. **Listar todas as transações**
```
GET /transacoes
```
**Resposta:**
```json
[
  {
    "id": 1,
    "descricao": "Salário",
    "categoria": "Renda",
    "valor": "3000.00",
    "tipo": "entrada",
    "metodo_pagamento": "pix",
    "observacao": "Salário mensal",
    "data": "2026-04-29T03:30:39.927Z"
  }
]
```

---

### 2. **Criar nova transação**
```
POST /transacoes
Content-Type: application/json
```
**Body:**
```json
{
  "descricao": "Compra de alimentos",
  "categoria": "Alimentação",
  "valor": 150,
  "tipo": "saida",
  "metodo_pagamento": "pix",
  "observacao": "Compras do mês"
}
```
**Resposta:** (Status 201)
```json
{
  "id": 8,
  "descricao": "Compra de alimentos",
  "categoria": "Alimentação",
  "valor": "150.00",
  "tipo": "saida",
  "metodo_pagamento": "pix",
  "observacao": "Compras do mês",
  "data": "2026-04-29T04:30:00.000Z"
}
```

---

### 3. **Atualizar transação**
```
PUT /transacoes/:id
Content-Type: application/json
```
**Body:**
```json
{
  "descricao": "Salário corrigido",
  "categoria": "Renda",
  "valor": 3500,
  "tipo": "entrada",
  "metodo_pagamento": "pix",
  "observacao": "Salário atualizado"
}
```

---

### 4. **Deletar transação**
```
DELETE /transacoes/:id
```
**Resposta:**
```json
{
  "mensagem": "Transação deletada com sucesso",
  "transacao": { /* dados da transação deletada */ }
}
```

---

##  Endpoints de Análise

### 5. **Resumo Financeiro**
```
GET /resumo
```
**Resposta:**
```json
{
  "saldo": 7100.00,
  "entradas": 3000.00,
  "saidas": -900.00
}
```

---

### 6. **Gasto por Categoria**
```
GET /gasto-categoria
```
**Resposta:**
```json
{
  "categorias": [
    {
      "categoria": "Eletrônicos",
      "total": 6000.00
    },
    {
      "categoria": "Alimentação",
      "total": 150.00
    }
  ]
}
```

---

### 7. **Média Mensal de Gastos**
```
GET /media-mensal
```
**Resposta:**
```json
{
  "mediaMensal": 2050.00
}
```

---

### 8. **Maior Gasto Registrado**
```
GET /maior-gasto
```
**Resposta:**
```json
{
  "id": 6,
  "descricao": "Computador",
  "categoria": "Eletrônicos",
  "valor": "5000.00",
  "tipo": "saida",
  "metodo_pagamento": "cartao",
  "observacao": "Compra da Semana",
  "data": "2026-04-29T04:02:44.693Z"
}
```

---

### 9. **Menor Gasto Registrado**
```
GET /menor-gasto
```
**Resposta:**
```json
{
  "id": 4,
  "descricao": "Goku",
  "categoria": "brinquedo",
  "valor": "250.00",
  "tipo": "saida",
  "metodo_pagamento": "pix",
  "observacao": "Compra da Semana",
  "data": "2026-04-29T03:54:35.176Z"
}
```

---

### 10. **Variação Mensal**
```
GET /variacao-mensal
```
**Resposta:**
```json
{
  "dadosMensais": [
    {
      "mes": "2026-04-01T00:00:00.000Z",
      "total": 5500.00
    }
  ],
  "variacoes": [
    {
      "mes": "2026-05-01T00:00:00.000Z",
      "variacao": 2000.00
    }
  ]
}
```

---

##  Endpoints de Filtro

### 11. **Filtrar por Período**
```
GET /transacoes/periodo?dataInicio=2026-04-29&dataFim=2026-04-30
```
**Retorna:** Transações dentro do período especificado

---

### 12. **Filtrar por Categoria**
```
GET /transacoes/categoria?categoria=Alimentação
```
**Retorna:** Transações da categoria especificada (busca parcial)

---

### 13. **Filtrar por Tipo**
```
GET /transacoes/tipo?tipo=saida
```
**Parâmetros válidos:** `entrada` ou `saida`

---

### 14. **Filtrar por Faixa de Valor**
```
GET /transacoes/valor?min=100&max=1000
```
**Retorna:** Transações com valor entre o mínimo e máximo especificados

---

##  Validações

### Campo obrigatório:
- `descricao`, `valor`, `tipo` - Obrigatórios
- `categoria` - Obrigatória

### Validações de tipo:
- `tipo` - Deve ser: `entrada` ou `saida`
- `metodo_pagamento` - Deve ser: `pix`, `cartao` ou `dinheiro`
- `valor` - Não pode ser negativo

### Respostas de erro:

**400 - Dados Inválidos:**
```json
{
  "erro": "Descrição, valor e tipo são obrigatórios"
}
```

**404 - Não Encontrado:**
```json
{
  "erro": "Transação não encontrada"
}
```

**500 - Erro do Servidor:**
```json
{
  "erro": "Erro ao buscar transações"
}
```

---

##  Testando a API

### Usando o arquivo `teste.http`:
O projeto inclui um arquivo `teste.http` com exemplos de requisições que podem ser testadas com a extensão REST Client do VS Code.

### Usando cURL:
```bash
# Listar transações
curl http://localhost:3000/transacoes

# Criar transação
curl -X POST http://localhost:3000/transacoes \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Teste","categoria":"Test","valor":50,"tipo":"saida"}'

# Filtrar por período
curl "http://localhost:3000/transacoes/periodo?dataInicio=2026-04-29&dataFim=2026-04-30"
```

---

##  Notas Importantes

- O servidor se conecta automaticamente ao PostgreSQL na porta 5432
- As datas são armazenadas em formato TIMESTAMP (UTC)
- Os valores monetários usam precisão de 2 casas decimais (NUMERIC 10,2)
- Cada transação recebe automaticamente um `id` único (SERIAL)
- O campo `data` é preenchido automaticamente com o timestamp atual

---

##  Autor

Projeto desenvolvido para a disciplina de Aplicação Digital - 5º Semestre

---

##  Licença

ISC
