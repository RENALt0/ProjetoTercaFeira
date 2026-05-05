const API_URL = "http://localhost:3000";

// FUNÇÃO PARA ADICIONAR TRANSAÇÃO
async function adicionarTransacao() {
  const descricao = document.getElementById("descricao").value;
  const categoria = document.getElementById("categoria").value;
  const valor = document.getElementById("valor").value;
  const tipo = document.getElementById("tipo").value;
  const metodo_pagamento = document.getElementById("metodo_pagamento").value;
  const observacao = document.getElementById("observacao").value;

  try {
    const response = await fetch(`${API_URL}/transacoes`, {
      method: "POST",
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

    alert("Transação adicionada!");

    limparCampos();
    carregarTransacoes();
    carregarResumo();

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor");
  }
}

async function carregarTransacoes() {
  try {
    const response = await fetch(`${API_URL}/transacoes`);
    const transacoes = await response.json();

    const lista = document.getElementById("listaTransacoes");
    lista.innerHTML = "";

    transacoes.forEach(transacao => {
      const item = document.createElement("li");
      item.textContent = `${transacao.descricao} - ${transacao.categoria} - R$ ${transacao.valor} - ${transacao.tipo} - ${transacao.metodo_pagamento}`;
      lista.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

async function carregarResumo() {
  try {
    const response = await fetch(`${API_URL}/resumo`);
    const resumo = await response.json();

    document.getElementById("saldo").textContent = `Saldo: R$ ${resumo.saldo}`;
    document.getElementById("entradas").textContent = `Entradas: R$ ${resumo.entradas}`;
    document.getElementById("saidas").textContent = `Saídas: R$ ${resumo.saidas}`;
  } catch (error) {
    console.error(error);
  }
}

function limparCampos() {
  document.getElementById("descricao").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("observacao").value = "";
}

window.adicionarTransacao = adicionarTransacao;

window.addEventListener("DOMContentLoaded", () => {
  carregarTransacoes();
  carregarResumo();
});

