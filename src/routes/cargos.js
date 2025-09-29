var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController");

router.post("/cadastrarCargo", function(req, res) {
    cargoController.cadastrarCargo(req, res);
});

module.exports = router;