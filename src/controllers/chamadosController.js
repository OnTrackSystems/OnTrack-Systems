let chamadosModel = require("../models/chamadosModel");

function listarChamados(req,res){
    chamadosModel.buscarChamados().then((resultado) => {
        res.status(200).json(resultado);
    });
}
module.exports={
    listarChamados
}