const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/", auth, (req, res) => {
  const filial = req.user.filial;

  db.query(
    "SELECT * FROM produtos WHERE filial = ?",
    [filial],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

module.exports = router;
