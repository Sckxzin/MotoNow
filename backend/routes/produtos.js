const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

// LISTAR PRODUTOS POR FILIAL
router.get("/", auth, (req, res) => {
  const { filial, perfil } = req.user;

  let sql = "SELECT * FROM produtos";
  let params = [];

  // DIRETORIA vê tudo
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
