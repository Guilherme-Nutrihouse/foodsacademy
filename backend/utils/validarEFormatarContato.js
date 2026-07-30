const criarErroValidacao = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validarTextoObrigatorio = (valor, campo) => {
  if (typeof valor !== "string" || !valor.trim()) {
    throw criarErroValidacao(`${campo} e obrigatorio.`);
  }

  return valor.trim();
};

function formatarIniciais(texto) {
  return texto
    .toLowerCase()
    .split(/\s+/)
    .map((palavra) => {
      // Mantem conectores comuns em minusculo.
      if (/^(de|da|do|dos|das|e)$/.test(palavra)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

function formatarTelefoneBR(telefone) {
  let numeros = telefone.replace(/\D/g, "");

  if (numeros.length > 11 && numeros.startsWith("55")) {
    numeros = numeros.slice(2);
  }

  if (numeros.length < 10 || numeros.length > 11) {
    throw criarErroValidacao("Telefone invalido.");
  }

  return numeros.length === 11
    ? numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, "+55 ($1) $2-$3")
    : numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, "+55 ($1) $2-$3");
}

function validarEFormatarContato(data = {}) {
  const nome = validarTextoObrigatorio(data.nome, "Nome");
  const telefone = validarTextoObrigatorio(data.telefone, "Telefone");
  const tipo = validarTextoObrigatorio(data.tipo, "Tipo");
  const departamento = validarTextoObrigatorio(data.departamento, "Departamento");

  return {
    nome: formatarIniciais(nome),
    telefone: formatarTelefoneBR(telefone),
    tipo: formatarIniciais(tipo),
    departamento: formatarIniciais(departamento),
  };
}

module.exports = { validarEFormatarContato };
