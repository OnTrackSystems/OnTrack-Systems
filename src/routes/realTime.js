let express = require("express");
let router = express.Router();

let dashGeralController = require("../controllers/dashTimeController"); 

router.get("/listarGaragens/:fkEmpresa", function(req, res) {
    dashGeralController.listarGaragens(req, res);
});

router.get("/getJsonUnica/:idGaragem", function (req, res) {
    dashGeralController.getJsonUnica(req, res);
});

router.get("/tamanhoDisco/:idGaragem", function(req, res) {
    dashGeralController.getTamanhoDisco(req, res);
});

router.get("/getJsonRelatorio/:idGaragem", function (req, res) {
    dashGeralController.getJsonRelatorio(req, res);
})

module.exports = router;