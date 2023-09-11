const jwt = require("jsonwebtoken");
const jwtSenhaPrivada = require("../jwtSenhaPrivada");
const pool = require("../conexao");

const validarToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({
      mensagem: `Para acessar este recurso um token de autenticação válido deve ser enviado.`,
    });
  }
  const token = authorization.split(" ")[1];
  try {
    const { id } = jwt.verify(token, jwtSenhaPrivada);
    const { rows, rowCount } = await pool.query(
      `select id, nome, email from usuarios where id= $1`,
      [id]
    );

    if (rowCount < 1) {
      return res.status(401).json({ mensagem: "não autorizado" });
    }


    req.usuario = rows[0];

    return next();
  } catch (error) {
    return res.status(400).json({
      mensagem:
        "Para acessar este recurso um token de autenticação válido deve ser enviado.",
    });
  }
};

const validarNomeEmailSenha = (req, res, next) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios!" });
  }

  return next();
};

const verificarEmailExisteNoBancoDeDados = async (req, res, next) => {
  const { email } = req.body;
  let query = "";
  let parametros = [];

  if (req.usuario) {
    query = "select * from usuarios where email = $1 and id != $2";
    parametros = [email, req.usuario.id];
  } else {
    query = "select * from usuarios where email = $1";
    parametros = [email];
  }
  const validarEmail = await pool.query(query, parametros);

  if (validarEmail.rowCount >= 1) {
    return res.status(400).json({
      mensagem: "O e-mail informado já está sendo utilizado por outro usuário.",
    });
  }
  return next();
};

module.exports = {
  validarToken,
  validarNomeEmailSenha,
  verificarEmailExisteNoBancoDeDados,
};
