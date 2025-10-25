var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController");

router.post("/cadastrarCargo", function(req, res) {
    cargoController.cadastrarCargo(req, res);
});

router.get("/listarCargos/:fkEmpresa", function(req, res) {
    cargoController.listarCargos(req, res);
});

router.delete("/removerCargo/:idCargo", function(req, res) {
    cargoController.removerCargo(req, res);
});

router.get("/listarPermissoes", function(req, res) {
    cargoController.listarPermissoes(req, res);
});

router.get("/listarPermissoesPorCargo/:idCargo", function(req, res) {
    cargoController.listarPermissoesPorCargo(req, res);
});

router.post("/adicionarPermissaoCargo", function(req, res) {
    cargoController.adicionarPermissaoCargo(req, res);
});

router.delete("/removerPermissaoCargo/:idCargo/:idPermissao", function(req, res) {
    cargoController.removerPermissaoCargo(req, res);
});

module.exports = router;
