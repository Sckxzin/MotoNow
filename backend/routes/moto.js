const express = require("express");
const db = require("../db");
const auth = require("../middlewares/auth");

const router = express.Router();

/* =====================================================
   LISTAR MOTOS DISPONÍVEIS
   - FILIAL → só da sua filial
   - DIRETORIA → todas
   - venda_id IS NULL = disponível
===================================================== */
router.get("/", auth, (req, res) => {
  let sql = `
    SELECT *
    FROM motos
    WHERE venda_id IS NULL
  `;
  const params = [];

  if (req.userPerfil !== "DIRETORIA") {
    sql += " AND cidade = ?";
    params.push(req.userFilial);
  }

  sql += " ORDER BY modelo";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* =====================================================
   MARCAR MOTO COMO VENDIDA
   - Vincula à venda
   - Moto some da lista automaticamente
===================================================== */
router.put("/:id/vender", auth, (req, res) => {
  const moto_id = req.params.id;
  const { venda_id } = req.body;

  if (!venda_id) {
    return res.status(400).json({
      message: "Venda não informada"
    });
  }

  db.query(
    `
    UPDATE motos
    SET venda_id = ?
    WHERE id = ?
      AND venda_id IS NULL
    `,
    [venda_id, moto_id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message: "Moto já vendida ou não encontrada"
        });
      }

      res.json({ message: "Moto vendida com sucesso" });
    }
  );
});

module.exports = router;
