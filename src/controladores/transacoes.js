const jwt = require("jsonwebtoken");
const jwtSenhaPrivada = require("../jwtSenhaPrivada");
const pool = require("../conexao");
const { validarNumeroCategoria } = require("../utils");

const cadastrarTransacao = async function (req, res) {
  const { authorization } = req.headers;
  const { descricao, valor, data, categoria_id, tipo } = req.body;

  if (
    !descricao ||
    descricao.trim() === "" ||
    !valor ||
    !data ||
    data.trim() === "" ||
    !categoria_id ||
    !tipo ||
    tipo.trim() === ""
  ) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos obrigatórios devem ser informados." });
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    return res.status(400).json({ mensagem: "Tipo de transação inválido." });
  }

  if (!validarNumeroCategoria(categoria_id)) {
    return res.status(400).json({
      mensagem:
        "O ID da categoria informado é inválido. Favor informar um valor válido.",
    });
  }

  // if (categoria_id < 1 || categoria_id > 17) {
  //   return res.status(400).json({
  //     mensagem:
  //       "O ID da categoria informado é inválido. Favor informar um valor válido.",
  //   });
  // }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, jwtSenhaPrivada);

    const resultadoQuery = await pool.query(
      `insert into transacoes 
        (descricao, valor, data, categoria_id, tipo, usuario_id)
        values
        ($1, $2, $3, $4, $5, $6) 
        returning *`,
      [descricao, valor, data, categoria_id, tipo, id]
    );

    if (resultadoQuery.rowCount < 1) {
      return res.status(401).json({ mensagem: "não autorizado" });
    }

    const transacaoCadastrada = resultadoQuery.rows[0];
    const categoriaTransacaoCadastrada = await pool.query(
      "select descricao from categorias where id = $1",
      [categoria_id]
    );
    transacaoCadastrada.categoria_nome =
      categoriaTransacaoCadastrada.rows[0].descricao;

    return res.status(201).json(transacaoCadastrada);
  } catch (error) {
    return res.status(401).json({ mensagem: "Erro interno do servidor" });
  }
};

const atualizarTransacao = async function (req, res) {
  const id_transacao = req.params.id;
  const { descricao, valor, data, categoria_id, tipo } = req.body;

  if (tipo !== "entrada" && tipo !== "saida") {
    return res.status(400).json({ mensagem: "tipo da transação inválido" });
  }
  if (
    !descricao ||
    descricao.trim() === "" ||
    !valor ||
    !data ||
    data.trim() === "" ||
    !categoria_id ||
    !tipo ||
    tipo.trim() === ""
  ) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos obrigatórios devem ser informados." });
  }

  if (!validarNumeroCategoria(categoria_id)) {
    return res.status(400).json({
      mensagem:
        "O ID da categoria informado é inválido. Favor informar um valor válido.",
    });
  }

  try {
    const { id: id_usuario } = req.usuario;

    const { rows, rowCount } = await pool.query(
      `update transacoes
        set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5
        where id = $6 and usuario_id = $7 returning *`,
      [descricao, valor, data, categoria_id, tipo, id_transacao, id_usuario]
    );

    if (rowCount < 1) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const deletarTransacao = async function (req, res) {
  const id_transacao = req.params.id;

  try {
    const { id: id_usuario } = req.usuario;

    const { rows, rowCount } = await pool.query(
      `delete from transacoes
            where id = $1 and usuario_id = $2 returning *`,
      [id_transacao, id_usuario]
    );

    if (rowCount < 1) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    return res.status(204).end();
  } catch (error) {
    return res.status(401).json({ mensagem: "erro interno no servidor" });
  }
};

const obterExtrato = async function (req, res) {
  try {
    const { id: id_usuario } = req.usuario;

    const { rows: somaEntradas, rowCount: rowCount1 } = await pool.query(
      `select sum(valor) from transacoes
            where usuario_id = $1 and tipo = $2`,
      [id_usuario, "entrada"]
    );
    if (!somaEntradas[0].sum) {
      somaEntradas[0].sum = 0;
    }
    const { rows: somaSaidas, rowCount: rowCount2 } = await pool.query(
      `select sum(valor) from transacoes
           where usuario_id = $1 and tipo = $2`,
      [id_usuario, "saida"]
    );

    if (!somaSaidas[0].sum) {
      somaSaidas[0].sum = 0;
    }

    return res
      .status(200)
      .json({ entradas: somaEntradas[0].sum, saidas: somaSaidas[0].sum });
  } catch (error) {
    return res.status(500).json({ mensagem: "erro interno no servidor" });
  }
};

const detalharTransacaoUsuariologado = async (req, res) => {
  const { token, id } = req.usuario;
  const idTransacao = req.params.id;
  const query = "select * from transacoes where id = $1 and usuario_id = $2;";
  const parametros = [idTransacao, id];
  try {
    const resultadoQuery = await pool.query(query, parametros);
    if (resultadoQuery.rowCount < 1) {
      return res.status(404).json({ mensagem: "Transação não encontrada" });
    }
    const categoriaTransacaoCadastrada = await pool.query(
      "select descricao from categorias where id = $1",
      [resultadoQuery.rows[0].categoria_id]
    );

    const transacaoCadastrada = {
      ...resultadoQuery.rows[0],
      categoria_nome: categoriaTransacaoCadastrada.rows[0].descricao,
    };
    return res.status(200).json(transacaoCadastrada);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

module.exports = {
  cadastrarTransacao,
  atualizarTransacao,
  deletarTransacao,
  obterExtrato,
  detalharTransacaoUsuariologado,
};
