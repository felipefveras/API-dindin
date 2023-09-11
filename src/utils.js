const bcrypt = require("bcrypt");

const criptografarSenha = async (senha) => {
  senha = await bcrypt.hash(senha, 10);
  return senha;
};

const validarNumeroCategoria = (categoria_id) => {
  if (categoria_id < 1 || categoria_id > 17) {
    return false
  }
  return true;
};
module.exports = {
  criptografarSenha,
  validarNumeroCategoria,
};
