const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

/* =====================================================
   CRIAR VENDA
   - Qualquer filial pode vender
   - Venda fica vinculada ao usuário
===================================================== */
router.post("/", auth, (req, res) => {
  const {
    cliente_nome,
    cliente_cpf,
    cliente_telefone,
    forma_pagamento
  } = req.body;

  if (!cliente_nome || !forma_pagamento) {
    return res.status(400).json({
      message: "Dados da venda incompletos"
    });
  }

  db.query(
    `INSERT INTO vendas
     (usuario_id, cliente_nome, cliente_cpf, cliente_telefone, forma_pagamento, total)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [
      req.userId,
      cliente_nome,
      cliente_cpf || null,
      cliente_telefone || null,
      forma_pagamento
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ venda_id: result.insertId });
    }
  );
});

/* =====================================================
   ADICIONAR ITEM NA VENDA
===================================================== */
router.post("/:id/itens", auth, (req, res) => {
  const { produto_id, quantidade, valor_unitario } = req.body;
  const venda_id = req.params.id;

  if (!produto_id || !quantidade || !valor_unitario) {
    return res.status(400).json({
      message: "Item inválido"
    });
  }

  db.query(
    `INSERT INTO venda_itens
     (venda_id, produto_id, quantidade, valor_unitario)
     VALUES (?, ?, ?, ?)`,
    [venda_id, produto_id, quantidade, valor_unitario],
    err => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Item adicionado" });
    }
  );
});

/* =====================================================
   FINALIZAR VENDA
   - Atualiza total
   - Dá baixa no estoque
===================================================== */
router.post("/:id/finalizar", auth, (req, res) => {
  const venda_id = req.params.id;

  // 1️⃣ Buscar itens
  db.query(
    `SELECT produto_id, quantidade, valor_unitario
     FROM venda_itens
     WHERE venda_id = ?`,
    [venda_id],
    (err, itens) => {
      if (err) return res.status(500).json(err);

      if (itens.length === 0) {
        return res.status(400).json({
          message: "Venda sem itens"
        });
      }

      // 2️⃣ Calcular total
      const total = itens.reduce(
        (s, i) => s + Number(i.valor_unitario) * Number(i.quantidade),
        0
      );

      // 3️⃣ Atualizar total da venda
      db.query(
        "UPDATE vendas SET total = ? WHERE id = ?",
        [total, venda_id],
        err => {
          if (err) return res.status(500).json(err);

          // 4️⃣ Dar baixa no estoque
          itens.forEach(item => {
            db.query(
              `UPDATE produtos
               SET estoque = estoque - ?
               WHERE id = ?`,
              [item.quantidade, item.produto_id]
            );
          });

          res.json({
            message: "Venda finalizada com sucesso",
            total
          });
        }
      );
    }
  );
});

/* =====================================================
   LISTAR VENDAS
   - FILIAL → vê apenas suas vendas
   - DIRETORIA → vê todas as vendas (com filial)
===================================================== */
router.get("/", auth, (req, res) => {
  let sql = `
    SELECT 
      v.id,
      v.cliente_nome,
      v.forma_pagamento,
      v.total,
      v.created_at,
      u.filial
    FROM vendas v
    JOIN usuarios u ON v.usuario_id = u.id
  `;

  const params = [];

  if (req.userPerfil !== "DIRETORIA") {
    sql += " WHERE u.filial = ?";
    params.push(req.userFilial);
  }

  sql += " ORDER BY v.created_at DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
