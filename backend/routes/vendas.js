const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

// criar venda
router.post("/", auth, (req, res) => {
  const { cliente_id } = req.body;
  const { filial_id, id: usuario_id } = req.user;

  db.query(
    "INSERT INTO vendas (filial_id, cliente_id, usuario_id) VALUES (?,?,?)",
    [filial_id, cliente_id || null, usuario_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ venda_id: result.insertId });
    }
  );
});

// adicionar item ao carrinho
router.post("/:id/itens", auth, (req, res) => {
  const venda_id = req.params.id;
  const { produto_id, quantidade, valor_unitario, brinde } = req.body;

  db.query(
    "SELECT tipo, valor_sugerido FROM produtos WHERE id = ?",
    [produto_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(404).json({ message: "Produto não encontrado" });

      const produto = rows[0];
      let valorFinal = valor_unitario;

      if (produto.tipo === "OLEO") valorFinal = produto.valor_sugerido;
      if (produto.tipo === "CAPACETE" && brinde) valorFinal = 0;

      db.query(
        `INSERT INTO venda_itens
         (venda_id, produto_id, quantidade, valor_unitario, brinde)
         VALUES (?,?,?,?,?)`,
        [venda_id, produto_id, quantidade, valorFinal, brinde || false],
        err2 => {
          if (err2) return res.status(500).json(err2);
          res.json({ message: "Item adicionado" });
        }
      );
    }
  );
});

// finalizar venda
router.post("/:id/finalizar", auth, (req, res) => {
  const venda_id = req.params.id;

  db.query(
    `SELECT produto_id, quantidade
     FROM venda_itens
     WHERE venda_id = ?`,
    [venda_id],
    (err, itens) => {
      if (err) return res.status(500).json(err);

      itens.forEach(i => {
        db.query(
          "UPDATE produtos SET estoque = estoque - ? WHERE id = ?",
          [i.quantidade, i.produto_id]
        );
      });

      res.json({ message: "Venda finalizada" });
    }
  );
});

module.exports = router;
