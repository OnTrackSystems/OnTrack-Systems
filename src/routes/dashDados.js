let express = require("express");
let router = express.Router();

let dashDadosController = require("../controllers/dashDadosController");

router.get("/listarGaragens/:fkEmpresa", function(req, res) {
    dashDadosController.listarGaragens(req, res);
});

router.get("/getJsonDashDados", function(req,res){
    chamadosController.getJsonDashDados(req,res)
});

module.exports = router;