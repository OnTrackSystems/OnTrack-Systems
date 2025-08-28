var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});
router.get("/buscarUsuarios/:idEmpresa", function (req, res) {
    usuarioController.buscarUsuarios(req, res);
});
router.delete("/deletarUsuarios/:idUsuario",function(req,res){
    usuarioController.deletarUsuarios(req,res);
}
)

module.exports = router;