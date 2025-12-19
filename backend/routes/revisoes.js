const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/", auth, (req, res) => {
  const { moto_id, quantidade_oleo } = req.body;

  db.query(
    "INSERT INTO revisoes (moto_id, quantidade_oleo) VALUES (?,?)",
    [moto_id, quantidade_oleo || 0],
    err => {
      if (err) return res.status(500).json(err);

      if (quantidade_oleo > 0) {
        db.query(
          "UPDATE produtos SET estoque = estoque - ? WHERE tipo = 'OLEO'",
          [quantidade_oleo]
        );
      }

      res.json({ message: "Revisão registrada" });
    }
  );
});

module.exports = router;
