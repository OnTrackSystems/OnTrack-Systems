var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController");

router.post("/cadastrarCargo", function(req, res) {
    cargoController.cadastrarCargo(req, res);
});

router.get("/listarCargos/:fkEmpresa", function(req, res) {
    cargoController.listarCargos(req, res);
});

router.delete("/removerCargo/:idCargo/:fkEmpresa", function(req, res) {
    cargoController.removerCargo(req, res);
});

module.exports = router;
