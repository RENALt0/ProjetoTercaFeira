const API_URL = "https://projetotercafeira.onrender.com";
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


// GLOBAL (HTML)
window.adicionarTransacao = adicionarTransacao;
window.deletarTransacao = deletarTransacao;
window.editarTransacao = editarTransacao;


// INIT
window.addEventListener("DOMContentLoaded", () => {
  carregarTransacoes();
  carregarResumo();
});