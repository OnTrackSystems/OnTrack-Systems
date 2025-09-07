var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

// Listar máquinas de uma empresa
router.get("/", function (req, res) {
    maquinaController.listarPorEmpresa(req, res);
});

// Listar todos os componentes cadastrados
router.get("/listar", function (req, res) {
    maquinaController.listar(req, res);
});

// Cadastrar nova máquina
router.post("/adicionar", function (req, res) {
    maquinaController.cadastrar(req, res);
});

// Editar máquina
router.put("/editar", function (req, res) {
    maquinaController.editar(req, res);
});

// Excluir máquina
router.delete("/excluir/:idMaquina", function (req, res) {
    maquinaController.excluir(req, res);
});

module.exports = router;
