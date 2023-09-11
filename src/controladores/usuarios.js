const pool = require("../conexao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSenhaPrivada = require("../jwtSenhaPrivada");
const { criptografarSenha } = require("../utils");

const cadastrarUsuario = async function (req, res) {
  const { nome, email, senha } = req.body;

  try {
    const senhaCriptografada = await criptografarSenha(senha);

    const novoUsuario = await pool.query(
      `insert into usuarios (nome, email, senha)
        values ($1, $2, $3) returning *`,
      [nome, email, senhaCriptografada]
    );

    const { senha: a, ...usuarioCadastrado } = novoUsuario.rows[0];
    return res.status(201).json(usuarioCadastrado);
  } catch (error) {
    return res.json({ mensagem: "erro no servidor" });
  }
};

const login = async function (req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "todos os campos são obrigatórios!" });
  }

  try {
    const usuario = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );

    if (usuario.rowCount < 1) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
      return res.status(400).json({ mensagem: "usuário e/ou senha inválidos" });
    }

    const token = jwt.sign({ id: usuario.rows[0].id }, jwtSenhaPrivada, {
      expiresIn: "8h",
    });

    const { senha: a, ...usuarioLogado } = usuario.rows[0];

    return res.status(200).json({ usuario: usuarioLogado, token });
  } catch (error) {
    return res.status(500).json({ mensagem: "erro no servidor" });
  }
};

const editarPerfilUsuarioLogado = async (req, res) => {
  const { nome, email, senha } = req.body;
  const { id } = req.usuario;

  const query =
    "update usuarios set nome = $1, email = $2, senha = $3 where id = $4 returning *";
  const senhaCriptografada = await criptografarSenha(senha);
  const parametros = [nome, email, senhaCriptografada, id];

  try {
    const usuarioEditado = await pool.query(query, parametros);
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const detalharPerfilUsuarioLogado = async function (req, res) {
  return res.json(req.usuario);
};

const listarCategorias = async (req, res) => {
  try {
    const listaCategorias = await pool.query("select * from categorias");
    return res.status(200).json(listaCategorias.rows);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const listarTransacoes = async (req, res) => {
  const { token, id } = req.usuario;

  const query = "select * from transacoes where usuario_id = $1";
  try {
    const listaDeTransacoes = await pool.query(query, [id]);
    return res.status(200).json(listaDeTransacoes.rows);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};


module.exports = {
  cadastrarUsuario,
  login,
  detalharPerfilUsuarioLogado,
  listarCategorias,
  listarTransacoes,
  editarPerfilUsuarioLogado,
};
