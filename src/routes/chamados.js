var express = require("express");
var router = express.Router();

let chamadosController = require('../controllers/chamadosController');

router.get("/listarChamados/", function(req,res){
    chamadosController.listarChamados(req,res)
})

router.get("/getCallsFromBucket/", function(req,res){
    chamadosController.getCallsFromBucket(req,res)
})

router.get("/getCallsFromBucketOpen/", function(req,res){
    chamadosController.getCallsFromBucketOpen(req,res)
})

module.exports = router;