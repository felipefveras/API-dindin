const express = require("express");
const roteador = express.Router();

const {
  validarToken,
  validarNomeEmailSenha,
  verificarEmailExisteNoBancoDeDados,
} = require("../intermediarios/intermediarios");

const {
  cadastrarUsuario,
  login,
  detalharPerfilUsuarioLogado,
  listarCategorias,
  listarTransacoes,
  editarPerfilUsuarioLogado,
} = require("../controladores/usuarios");

const {
  cadastrarTransacao,
  atualizarTransacao,
  deletarTransacao,
  obterExtrato,
  detalharTransacaoUsuariologado,
} = require("../controladores/transacoes");

roteador.post(
  "/usuario",
  validarNomeEmailSenha,
  verificarEmailExisteNoBancoDeDados,
  cadastrarUsuario
);
roteador.post("/login", login);

roteador.use(validarToken);
roteador.get("/usuario", detalharPerfilUsuarioLogado);
roteador.get("/categoria", listarCategorias);
roteador.get("/transacao", listarTransacoes);
roteador.get("/transacao/extrato", obterExtrato);
roteador.get("/transacao/:id", detalharTransacaoUsuariologado);
roteador.post("/transacao", cadastrarTransacao);
roteador.put("/transacao/:id", atualizarTransacao);
roteador.delete("/transacao/:id", deletarTransacao);
roteador.put(
  "/usuario",
  validarNomeEmailSenha,
  verificarEmailExisteNoBancoDeDados,
  editarPerfilUsuarioLogado
);

module.exports = roteador;
