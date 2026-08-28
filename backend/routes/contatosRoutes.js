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
        `INSERT INTO contatos (nome, telefone, tipo, departamento, data_criacao)
         OUTPUT INSERTED.id, INSERTED.nome, INSERTED.telefone, INSERTED.tipo, INSERTED.departamento, INSERTED.data_criacao
         VALUES (@nome, @telefone, @tipo, @departamento, GETDATE())`,
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

router.delete(
  "/contatos/:id",
  asyncRoute("Erro ao deletar contato", async (req, res) => {
   try {
     const id = Number(req.params.id);
 
     if (!Number.isInteger(id)) {
       return res.status(400).json({ error: "ID inválido." });
     }
 
     const [contatoDeletado] = await query(
       `DELETE FROM contatos
        OUTPUT DELETED.id, DELETED.nome, DELETED.telefone, DELETED.tipo, DELETED.departamento, DELETED.data_criacao
        WHERE id = @id`,
       {
         id: [sql.Int, id],
       },
     );
 
     if (!contatoDeletado) {
       return res.status(404).json({ error: "Contato não encontrado." });
     }
 
     res.json({
       message: "Contato deletado com sucesso.",
       contato: contatoDeletado,
     });
   } catch (error) {
    console.log(error)
   }
  
}));

router.put(
  "/contatos/:id",
  asyncRoute("Erro ao atualizar contato", async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const contato = validarEFormatarContato(req.body);
      const params = {
        id: [sql.Int, id],
        nome: [sql.NVarChar(150), contato.nome],
        telefone: [sql.NVarChar(25), contato.telefone],
        tipo: [sql.NVarChar(50), contato.tipo],
        departamento: [sql.NVarChar(100), contato.departamento],
      };

      const [contatoAtualizado] = await query(
        `UPDATE contatos
         SET nome = @nome, telefone = @telefone, tipo = @tipo, departamento = @departamento
         OUTPUT INSERTED.id, INSERTED.nome, INSERTED.telefone, INSERTED.tipo, INSERTED.departamento, INSERTED.data_criacao
         WHERE id = @id`,
        params,
      );

      if (!contatoAtualizado) {
        return res.status(404).json({ error: "Contato não encontrado." });
      }

      res.json({
        message: "Contato atualizado com sucesso.",
        contato: contatoAtualizado,
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
