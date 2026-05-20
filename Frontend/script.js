const API_URL = "http://localhost:3000";
let editandoId = null;

function formatarValor(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "0,00";
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ADICIONAR OU ATUALIZAR
async function adicionarTransacao() {
  const descricao = document.getElementById("descricao").value;
  const categoria = document.getElementById("categoria").value;
  const valor = document.getElementById("valor").value;
  const tipo = document.getElementById("tipo").value;
  const metodo_pagamento = document.getElementById("metodo_pagamento").value;
  const observacao = document.getElementById("observacao").value;

  const metodo = editandoId ? "PUT" : "POST";
  const url = editandoId
    ? `${API_URL}/transacoes/${editandoId}`
    : `${API_URL}/transacoes`;

  try {
    const response = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        descricao,
        categoria,
        valor,
        tipo,
        metodo_pagamento,
        observacao
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.erro);
      return;
    }

    alert(editandoId ? "Transação atualizada!" : "Transação adicionada!");

    limparCampos();
    editandoId = null;

    carregarTransacoes();
    carregarResumo();
    carregarGraficoCategorias();

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor");
  }
}


// LISTAR TRANSAÇÕES
async function carregarTransacoes() {
  try {
    const response = await fetch(`${API_URL}/transacoes`);
    const transacoes = await response.json();

    const lista = document.getElementById("listaTransacoes");
    lista.innerHTML = "";

    transacoes.forEach(transacao => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>${transacao.descricao}</td>
        <td>${transacao.categoria}</td>
        <td>R$ ${formatarValor(transacao.valor)}</td>
        <td>${transacao.tipo}</td>
        <td>${transacao.metodo_pagamento}</td>
        <td>
          <button onclick="editarTransacao(${transacao.id})">Editar</button>
          <button onclick="deletarTransacao(${transacao.id})">Excluir</button>
        </td>
      `;

      lista.appendChild(linha);
    });

  } catch (error) {
    console.error(error);
  }
}


// RESUMO
async function carregarResumo() {
  try {
    const response = await fetch(`${API_URL}/resumo`);
    const resumo = await response.json();

    const saldoEl = document.getElementById("saldo");

    saldoEl.textContent = `Saldo: R$ ${formatarValor(resumo.saldo)}`;

    saldoEl.classList.remove("positivo", "negativo");


    if (resumo.saldo < 0) {
     saldoEl.classList.add("negativo");
    } else {
     saldoEl.classList.add("positivo");
    }
    document.getElementById("entradas").textContent = `Entradas: R$ ${formatarValor(resumo.entradas)}`;
    document.getElementById("saidas").textContent = `Saídas: R$ ${formatarValor(resumo.saidas)}`;
  } catch (error) {
    console.error(error);
  }
}


// LIMPAR FORM
function limparCampos() {
  document.getElementById("descricao").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("observacao").value = "";

  editandoId = null;
}


// DELETAR
async function deletarTransacao(id) {
  const confirmar = confirm("Tem certeza que deseja deletar?");
  if (!confirmar) return;

  try {
    const response = await fetch(`${API_URL}/transacoes/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.erro);
      return;
    }

    alert("Transação deletada!");

    carregarTransacoes();
    carregarResumo();
    carregarGraficoCategorias();
  } catch (error) {
    console.error(error);
    alert("Erro ao deletar");
  }
}

// EDITAR (CARREGA NO FORM)
async function editarTransacao(id) {
  try {
    const response = await fetch(`${API_URL}/transacoes`);
    const transacoes = await response.json();

    const t = transacoes.find(tr => tr.id === id);

    document.getElementById("descricao").value = t.descricao;
    document.getElementById("categoria").value = t.categoria;
    document.getElementById("valor").value = t.valor;
    document.getElementById("tipo").value = t.tipo;
    document.getElementById("metodo_pagamento").value = t.metodo_pagamento;
    document.getElementById("observacao").value = t.observacao;

    editandoId = id;

  } catch (error) {
    console.error(error);
  }
}

// CHAT SIMPLES COM IA
function formatarRespostaIA(texto) {
  const safeText = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const formatInline = content =>
    content
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  return safeText
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map(block => {
      const lines = block.split(/\n/).map(line => line.trim()).filter(Boolean);
      if (lines.every(line => line.startsWith("- "))) {
        const items = lines.map(line => `<li>${formatInline(line.slice(2))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${lines.map(line => formatInline(line)).join("<br>")}</p>`;
    })
    .join("");
}

function adicionarMensagem(texto, remetente) {
  const chatWindow = document.getElementById("chatWindow");
  const mensagem = document.createElement("div");
  mensagem.className = `chat-message ${remetente}`;
  mensagem.innerHTML = remetente === "bot" ? formatarRespostaIA(texto) : texto.replace(/\n/g, "<br>");
  chatWindow.appendChild(mensagem);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function responderPergunta(pergunta) {

  try {

    const response = await fetch(`${API_URL}/chat`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        pergunta
      })
    });

    const data = await response.json();

    return data.resposta;

  } catch (error) {

    console.error(error);

    return "Erro ao conectar com a IA.";
  }
}
async function enviarPergunta() {
  const input = document.getElementById("chatInput");
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem(texto, "user");
  input.value = "";

  const resposta = await responderPergunta(texto);

  adicionarMensagem(resposta, "bot");
}

let graficoCategorias = null;

async function carregarGraficoCategorias() {

  try {

    const response = await fetch(`${API_URL}/gasto-categoria`);

    const dados = await response.json();

    const categorias = dados.categorias.map(item => item.categoria);

    const valores = dados.categorias.map(item => item.total);

    const ctx = document
      .getElementById("graficoCategorias")
      .getContext("2d");

    // evita criar gráfico duplicado
    if (graficoCategorias) {
      graficoCategorias.destroy();
    }

    graficoCategorias = new Chart(ctx, {

      type: "doughnut",

      data: {
        labels: categorias,

        datasets: [{
                label: "Gastos",

                data: valores,

          backgroundColor: [
            "#9036f7",
            "#e6a94f",
            "#50dddd",
            "#45c465",
            "#ca39ab",
            "#f12a2a",
            "#170da8"
          ],

          borderColor: "#ffffffbd",

          borderWidth: 3
        }]
      },

      options: {

        responsive: true,

        plugins: {

          legend: {
            labels: {
              color: "white"
            }
          }

        }

      }

    });

  } catch (error) {

    console.error(error);

  }
}

// GLOBAL (HTML)
window.adicionarTransacao = adicionarTransacao;
window.deletarTransacao = deletarTransacao;
window.editarTransacao = editarTransacao;
window.enviarPergunta = enviarPergunta;

// INIT
window.addEventListener("DOMContentLoaded", () => {
  carregarTransacoes();
  carregarResumo();
  carregarGraficoCategorias();
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        enviarPergunta();
      }
    });
  }
});