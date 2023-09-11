const express = require("express");
const roteador = require("./rotas/rotas");
const app = express();
const PORTA = 3000;

app.use(express.json());
app.use(roteador);

app.listen(PORTA, () => console.log(`Servidor rodando na porta ${PORTA}`));


