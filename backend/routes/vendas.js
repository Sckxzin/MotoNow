=const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

/* =========================
   CRIAR VENDA
========================= */
router.post("/", auth, async (req, res) => {
  const {
    cliente_nome,
    cliente_cpf,
    cliente_telefone,
    forma_pagamento,
    modelo_moto,
    chassi_moto
  } = req.body;

  const { filial, perfil } = req.user;

  try {
    const [result] = await db.promise().query(
      `INSERT INTO vendas 
      (cliente_nome, cliente_cpf, cliente_telefone, forma_pagamento, modelo_moto, chassi_moto, filial, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ABERTA')`,
      [
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        forma_pagamento,
        modelo_moto,
        chassi_moto,
        filial
      ]
    );

    res.json({ venda_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar venda" });
  }
});

/* =========================
   ADICIONAR ITENS À VENDA
========================= */
router.post("/:id/itens", auth, async (req, res) => {
  const vendaId = req.params.id;
  const { produto_id, quantidade, valor_unitario } = req.body;

  try {
    await db.promise().query(
      `INSERT INTO vendas_itens 
      (venda_id, produto_id, quantidade, valor_unitario)
      VALUES (?, ?, ?, ?)`,
      [vendaId, produto_id, quantidade, valor_unitario]
    );

    res.json({ message: "Item adicionado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao adicionar item" });
  }
});

/* =========================
   FINALIZAR VENDA + BAIXA DE ESTOQUE
========================= */
router.post("/:id/finalizar", auth, async (req, res) => {
  const vendaId = req.params.id;
  const { filial, perfil } = req.user;

  try {
    // 1️⃣ Buscar itens da venda
    const [itens] = await db.promise().query(
      `SELECT produto_id, quantidade 
       FROM vendas_itens 
       WHERE venda_id = ?`,
      [vendaId]
    );

    // 2️⃣ Baixar estoque (somente da filial logada)
    for (const item of itens) {
      await db.promise().query(
        `UPDATE produtos
         SET estoque = estoque - ?
         WHERE id = ? AND filial = ?`,
        [item.quantidade, item.produto_id, filial]
      );
    }

    // 3️⃣ Marcar venda como FINALIZADA
    await db.promise().query(
      `UPDATE vendas
       SET status = 'FINALIZADA'
       WHERE id = ?`,
      [vendaId]
    );

    res.json({ message: "Venda finalizada e estoque atualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao finalizar venda" });
  }
});

/* =========================
   LISTAR VENDAS (POR FILIAL)
========================= */
router.get("/", auth, async (req, res) => {
  const { filial, perfil } = req.user;

  try {
    let sql = "SELECT * FROM vendas";
    let params = [];

    if (perfil !== "DIRETORIA") {
      sql += " WHERE filial = ?";
      params.push(filial);
    }

    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar vendas" });
  }
});

module.exports = router;

