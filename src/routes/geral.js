let express = require("express");
let router = express.Router();

let dashGeralController = require("../controllers/dashGeralController"); 

router.get("/listarGaragens/:fkEmpresa", function(req, res) {
    dashGeralController.listarGaragens(req, res);
});

router.get("/getJsonDashDados/:idGaragem", function (req, res) {
    dashGeralController.getJsonDashDados(req, res);
});

router.get("/getJsonKPIs/:idGaragem", function (req, res) {
    dashGeralController.getJsonKPIs(req, res);
});

module.exports = router;