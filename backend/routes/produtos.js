const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

/* =====================================================
   LISTAR PRODUTOS
   - FILIAL → vê apenas produtos da própria filial
   - DIRETORIA → vê todos
===================================================== */
router.get("/", auth, (req, res) => {
  let sql = `
    SELECT *
    FROM produtos
    WHERE estoque > 0
  `;
  const params = [];

  // Se NÃO for diretoria, filtra pela filial do usuário
  if (req.userPerfil !== "DIRETORIA") {
    sql += " AND UPPER(filial) = UPPER(?)";
    params.push(req.userFilial);
  }

  sql += " ORDER BY nome";

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao listar produtos:", err);
      return res.status(500).json({ message: "Erro ao listar produtos" });
    }
    res.json(rows);
  });
});

/* =====================================================
   CADASTRAR PRODUTO
   - SOMENTE DIRETORIA
===================================================== */
router.post("/", auth, (req, res) => {
  if (req.userPerfil !== "DIRETORIA") {
    return res.status(403).json({
      message: "Apenas a diretoria pode cadastrar produtos"
    });
  }

  const {
    codigo,
    nome,
    tipo,
    valor_sugerido,
    estoque,
    modelo,
    filial
  } = req.body;

  if (!codigo || !nome || !tipo || valor_sugerido == null || !modelo || !filial) {
    return res.status(400).json({
      message: "Dados do produto incompletos"
    });
  }

  db.query(
    `
    INSERT INTO produtos
    (codigo, nome, tipo, valor_sugerido, estoque, modelo, filial)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      codigo,
      nome,
      tipo,
      valor_sugerido,
      estoque || 0,
      modelo,
      filial.toUpperCase()
    ],
    err => {
      if (err) {
        console.error("Erro ao cadastrar produto:", err);
        return res.status(500).json({ message: "Erro ao cadastrar produto" });
      }
      res.json({ message: "Produto cadastrado com sucesso" });
    }
  );
});

/* =====================================================
   ATUALIZAR PRODUTO
   - SOMENTE DIRETORIA
===================================================== */
router.put("/:id", auth, (req, res) => {
  if (req.userPerfil !== "DIRETORIA") {
    return res.status(403).json({
      message: "Apenas a diretoria pode editar produtos"
    });
  }

  const {
    codigo,
    nome,
    tipo,
    valor_sugerido,
    estoque,
    modelo,
    filial
  } = req.body;

  db.query(
    `
    UPDATE produtos
    SET
      codigo = ?,
      nome = ?,
      tipo = ?,
      valor_sugerido = ?,
      estoque = ?,
      modelo = ?,
      filial = ?
    WHERE id = ?
    `,
    [
      codigo,
      nome,
      tipo,
      valor_sugerido,
      estoque,
      modelo,
      filial.toUpperCase(),
      req.params.id
    ],
    err => {
      if (err) {
        console.error("Erro ao atualizar produto:", err);
        return res.status(500).json({ message: "Erro ao atualizar produto" });
      }
      res.json({ message: "Produto atualizado com sucesso" });
    }
  );
});

/* =====================================================
   REMOVER PRODUTO
   - SOMENTE DIRETORIA
===================================================== */
router.delete("/:id", auth, (req, res) => {
  if (req.userPerfil !== "DIRETORIA") {
    return res.status(403).json({
      message: "Apenas a diretoria pode remover produtos"
    });
  }

  db.query(
    "DELETE FROM produtos WHERE id = ?",
    [req.params.id],
    err => {
      if (err) {
        console.error("Erro ao remover produto:", err);
        return res.status(500).json({ message: "Erro ao remover produto" });
      }
      res.json({ message: "Produto removido com sucesso" });
    }
  );
});

module.exports = router;
