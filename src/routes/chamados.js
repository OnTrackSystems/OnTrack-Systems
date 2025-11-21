var express = require("express");
var router = express.Router();

let chamadosController = require('../controllers/chamadosController');

router.get("/listarChamados/", function(req,res){
    chamadosController.listarChamados(req,res)
})
module.exports = router;