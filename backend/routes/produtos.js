const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

// listar produtos (filtrado por filial)
router.get("/", auth, (req, res) => {
  const { perfil, filial } = req.user;

  let sql = "SELECT * FROM produtos";
  let params = [];

  // Se NÃO for diretoria, filtra pela filial
  if (perfil !== "DIRETORIA") {
    sql += " WHERE filial = ?";
    params.push(filial);
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
