let cargoModel = require("../models/cargoModel");

function cadastrarCargo(req, res) {
    let fkEmpresa = req.body.fkEmpresaServer;
    let nome = req.body.nomeCargoServer;

    cargoModel.cadastrarCargo(fkEmpresa, nome)
        .then((resultado) => {
            res.json({ mensagem: "Cargo cadastrado com sucesso!", resultado });
        })
        .catch((erro) => {
            console.error(erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}

function listarCargos(req, res) {
    let fkEmpresa = req.params.fkEmpresa; 

    cargoModel.listarCargos(fkEmpresa)
        .then((resultado) => {
            res.json(resultado);
        })
        .catch((erro) => {
            console.error(erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}

function removerCargo(req, res) {
    let idCargo = req.params.idCargo;

    cargoModel.removerCargo(idCargo)
        .then(() => {
            res.status(200).json({ mensagem: "Cargo removido com sucesso!" });
        })
        .catch((erro) => {
            console.error(erro);
            res.status(409).json({ mensagem: "Erro ao remover cargo: Existe um funcionário com este cargo" });
        });
}

module.exports = {
    cadastrarCargo,
    listarCargos,
    removerCargo
};
