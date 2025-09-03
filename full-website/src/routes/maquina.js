var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

router.get("/", function (req, res) {
    maquinaController.listarPorEmpresa(req, res);
});

module.exports = router;
