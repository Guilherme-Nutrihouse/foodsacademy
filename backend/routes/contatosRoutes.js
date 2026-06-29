const express = require('express');
const path = require('path'); // Necessario para montar URLs publicas de arquivos locais.

const { query } = require('../db'); // Necessario para consultar o SQL Server.
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const contatosFields = 'id, nome, telefone, tipo, departamento, data_criacao';



router.get(
    '/contatos',
    asyncRoute('Erro ao buscar contatos', async (req, res) => {
        try {
            const contatos = await query(`SELECT ${contatosFields} FROM contatos ORDER BY nome`);
            res.json(contatos);
        } catch (error) {
            console.log(error);
        }

    })
);



module.exports = router;