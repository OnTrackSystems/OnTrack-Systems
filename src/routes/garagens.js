var express = require("express");
var router = express.Router();

var garagemController = require("../controllers/garagemController");

router.post("/adicionarGaragem", function (req, res) {
    garagemController.adicionarGaragem(req, res);
});

router.get("/verificarGaragemNome/:nome", function (req, res) {
    garagemController.verificarGaragemNome(req, res);
});

module.exports = router;