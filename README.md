# Controle Financeiro API (Projeto Terca Feira)

## Objetivo
Aplicação **full‑stack** para gerenciamento de transações financeiras com **IA integrada** (Gemini). Inclui CRUD, relatórios, filtros avançados e um fallback de API AI que funciona sem necessidade de configuração manual.

## Funcionalidades atuais
- **CRUD completo** de transações (criar, listar, atualizar, deletar).
- **Relatórios**: resumo financeiro, gasto por categoria, média mensal, maior/menor gasto, variação mensal.
- **Filtros avançados**: período, categoria, tipo, faixa de valor.
- **IA integrada**: endpoint `/chat` que responde usando **Google Gemini**.
  - **Fallback interno**: chave de API codificada em Base64 (`QUl6YVN5QURSVTc0SEFyc19nMjlLT0ZHb2JFQTJ2Zy12QWtPN1JZ`) permite que a IA funcione mesmo sem `.env`.
- **Script `iniciar-projeto.bat`** (um clique):
  - Cria `.env` a partir de `.env.example` se não existir.
  - Verifica Docker instalado.
  - Executa `docker compose up --build -d`.
  - Aguarda 5 s e abre o navegador em `http://localhost:3000`.
  - **Não encerra** os containers ao fechar a janela (removido `docker compose down`).
- **Docker Compose** pronto para PostgreSQL + Node.js.
- **Variáveis de ambiente** (`.env.example` incluído):
  ```env
  GOOGLE_API_KEY=AIzaSy...   # opcional – sobrescreve fallback
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_NAME=controle_financeiro
  DB_HOST=postgres
  DB_PORT=5432
  ```

## Tecnologias
- **Node.js** + **Express** (API REST)
- **PostgreSQL** (via `pg` driver)
- **Docker & Docker‑Compose** (containerização)
- **Google Generative AI** (`@google/generative-ai`)

## Instalação
```bash
# 1. Clonar o repositório
git clone https://github.com/RENALt0/ProjetoTercaFeira.git
cd ProjetoTercaFeira

# 2. (Opcional) Instalar dependências localmente – necessário só se for rodar fora do Docker
npm install

# 3. Iniciar com um clique (recomendado)
#    Crie e execute o script .bat presente na raiz do projeto.
#    Ele criará .env, levantará os containers Docker e abrirá o navegador.
start iniciar-projeto.bat
```

> **Nota:** O script só funciona em **Windows**. Em Linux/macOS use o equivalente `docker compose up --build -d` após criar `.env` manualmente.

## Executando a API
- A API fica disponível em `http://localhost:3000`.
- Documentação dos endpoints está no próprio README (seções **Endpoints Disponíveis**).
- **Chat IA**: `POST /chat` com JSON `{ "pergunta": "..." }`.
  - Se `GOOGLE_API_KEY` estiver no `.env`, usa essa chave.
  - Caso contrário, usa a chave embutida (fallback).

## Estrutura do Projeto
```
.
├─ Frontend/
│  ├─ index.html        # interface principal da aplicação
│  ├─ style.css         # estilização da interface
│  ├─ script.js         # lógica do frontend e integração com a API
│  └─ imagens/          # imagem usada de fundo na interface
│
├─ routes/
│  ├─ transacoes.js     # CRUD e filtros de transações
│  ├─ dashboard.js      # relatórios e análises financeiras
│  └─ chat.js           # integração com IA Gemini
│
├─ utils/
│  └─ validacoes.js     # validações auxiliares
│
├─ db.js                # configuração PostgreSQL
├─ index.js             # servidor principal Express
├─ docker-compose.yaml  # orquestração dos containers
├─ Dockerfile           # configuração do container backend
├─ .env.example         # exemplo de variáveis de ambiente
├─ iniciar-projeto.bat  # inicialização automática do projeto
├─ teste.http           # testes de endpoints
└─ README.md            # documentação do projeto
```

## Testes rápidos
```bash
# Listar transações
curl http://localhost:3000/transacoes

# Criar transação
curl -X POST http://localhost:3000/transacoes \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Teste","categoria":"Misc","valor":42,"tipo":"saida"}'

# Chat com IA (sem .env)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"pergunta":"Qual é o saldo atual?"}'
```

## Notas importantes
- **Segurança**: a chave de API está codificada no código apenas para fins acadêmicos. Em produção, remova o fallback e use apenas `.env`.
- **Limite gratuito** da Gemini: suficiente para testes e demonstrações, mas pode ser atingido se houver uso intensivo.
- **Parar containers**: execute `docker compose down` manualmente quando quiser encerrar a aplicação.

## Autores

Heytor Vinicios Fonseca Palheta Ferreira 

João Victor Pires de Melo 

Nicolas Barbosa Freitas 

Renato Dorador Faulin 

Victor Lambertini Da Costa 


---

## Licença
ISC
