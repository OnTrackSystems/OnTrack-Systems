let usuarioModel = require("../models/cargoModel");

function cadastrarCargo(req, res) {
    let fkEmpresa = req.body.fkEmpresaServer;
    let nome = req.body.nomeCargoServer;

    usuarioModel.cadastrarCargo(fkEmpresa, nome).then((resultado) => {
        res.json(resultado);
    });
}

module.exports = {
    cadastrarCargo
}