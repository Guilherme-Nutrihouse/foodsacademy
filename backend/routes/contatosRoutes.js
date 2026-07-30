const express = require("express");

const { query, sql } = require("../db"); // Necessario para consultar o SQL Server.
const { validarEFormatarContato } = require("../utils/validarEFormatarContato");
const asyncRoute = require("./asyncRoute");

const router = express.Router();
const contatosFields = "id, nome, telefone, tipo, departamento, data_criacao";

router.get(
  "/contatos",
  asyncRoute("Erro ao buscar contatos", async (req, res) => {
    try {
      const contatos = await query(
        `SELECT ${contatosFields} FROM contatos ORDER BY nome`,
      );
      res.json(contatos);
    } catch (error) {
      console.log(error);
    }
  }),
);

router.post(
  "/contatos",
  asyncRoute("Erro ao adicionar contato", async (req, res) => {
    try {
      const contato = validarEFormatarContato(req.body);
      const params = {
        nome: [sql.NVarChar(150), contato.nome],
        telefone: [sql.NVarChar(25), contato.telefone],
        tipo: [sql.NVarChar(50), contato.tipo],
        departamento: [sql.NVarChar(100), contato.departamento],
      };

      const [novoContato] = await query(
        `INSERT INTO contatos (nome, telefone, tipo, departamento)
         OUTPUT INSERTED.id, INSERTED.nome, INSERTED.telefone, INSERTED.tipo, INSERTED.departamento, INSERTED.data_criacao
         VALUES (@nome, @telefone, @tipo, @departamento)`,
        params,
      );

      res.status(201).json({
        message: "Contato criado com sucesso.",
        contato: novoContato,
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ error: error.message });
      }

      throw error;
    }
  }),
);

module.exports = router;
