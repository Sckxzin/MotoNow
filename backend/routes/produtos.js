const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

// listar produtos
router.get("/", auth, (req, res) => {
  db.query("SELECT * FROM produtos", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
