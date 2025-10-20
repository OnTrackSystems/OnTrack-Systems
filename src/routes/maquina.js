var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

// Listar máquinas de uma empresa
router.get("/listarMaquinas/:idEmpresa", function (req, res) {
    maquinaController.listarMaquinas(req, res);
});

router.get("/", function(req, res) {
    maquinaController.listarPorEmpresa(req, res);
})

// Listar todos os componentes cadastrados
router.get("/listar", function (req, res) {
    maquinaController.listarComponentes(req, res);
});

router.post("/adicionarServidor", function(req, res) {
    maquinaController.adicionarServidor(req, res);
});

router.get("/buscarServidorUUID/:uuid", function(req, res) {
    maquinaController.buscarServidorUUID(req, res);
});

router.put("/atualizarServidor", function(req, res) {
    maquinaController.atualizarServidor(req, res);
});

// Cadastrar nova máquina
router.post("/adicionarComponente", function (req, res) {
    maquinaController.adicionarComponente(req, res);
});

// Excluir componente da máquina
router.delete("/excluirComponente/:idMaquina/:idComponente", function(req, res) {
    maquinaController.excluirComponente(req, res);
});

// Editar máquina
router.put("/editar", function (req, res) {
    maquinaController.editar(req, res);
});

// Excluir máquina
router.delete("/excluir/:idMaquina", function (req, res) {
    maquinaController.excluir(req, res);
});

router.get("/listarParametros/:idMaquina", function(req, res) {
    maquinaController.listarParametros(req, res);
})

module.exports = router;
