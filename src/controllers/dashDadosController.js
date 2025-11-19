let dashDadosModel = require("../models/dashDadosModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

module.exports = {
    listarGaragens
}