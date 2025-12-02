let express = require("express");
let router = express.Router();

let dashDadosController = require("../controllers/dashTransferenciaDadosController");

router.get("/listarGaragens/:fkEmpresa", function(req, res) {
    dashDadosController.listarGaragens(req, res);
});

router.get("/getJsonDashDados/:idGaragem", function(req,res){
    dashDadosController.getJsonDashDados(req,res)
});

router.get("/tamanhoDisco/:idGaragem", function(req, res) {
    dashDadosController.getTamanhoDisco(req, res);
});

module.exports = router;