var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

// Listar máquinas de uma empresa
router.get("/", function (req, res) {
    maquinaController.listarPorEmpresa(req, res);
});

// Cadastrar nova máquina
router.post("/adicionar", function (req, res) {
    maquinaController.cadastrar(req, res);
});

module.exports = router;
