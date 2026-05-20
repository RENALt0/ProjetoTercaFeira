// FUNÇÃO AUXILIAR: VALIDAR DADOS DE TRANSAÇÃO
// Evita repetir validações no POST e PUT
export function validarTransacao(descricao, valor, tipo) {

  if (!descricao || descricao.trim() === "" || valor === undefined || !tipo) {
    return "Descrição, valor e tipo são obrigatórios";
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    return "Tipo deve ser 'entrada' ou 'saida'";
  }

  const valorNumerico = Number(valor);

  if (valorNumerico < 0) {
    return "Valor não pode ser negativo";
  }

  if (isNaN(valorNumerico)) {
    return "Valor inválido";
  }

  return null;
}