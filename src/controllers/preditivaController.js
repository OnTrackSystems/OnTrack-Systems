let dashDadosModel = require("../models/preditivaModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    preditivaModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

module.exports = {
    listarGaragens
}