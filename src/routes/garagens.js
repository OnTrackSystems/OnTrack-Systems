var express = require("express");
var router = express.Router();

var garagemController = require("../controllers/garagemController");

router.post("/adicionarGaragem", function (req, res) {
    garagemController.adicionarGaragem(req, res);
});

router.get("/verificarGaragemId/:idGaragem", function (req, res) {
    garagemController.verificarGaragemId(req, res);
});

router.get("/buscarGaragem/:idGaragem", function (req, res) {
    garagemController.buscarGaragem(req, res);
})

module.exports = router;