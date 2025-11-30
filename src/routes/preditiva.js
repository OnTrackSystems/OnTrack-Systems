let express = require("express");
let router = express.Router();

let preditivaController = require("../controllers/preditivaController");

router.get("/listarGaragens/:fkEmpresa", function(req, res) {
    preditivaController.listarGaragens(req, res);
});

router.get("/:fkEmpresa", function (req, res) {
    preditivaController.JsonPreditiva(req,res)
});

module.exports = router;