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
function listarPermissoes(req, res) {
    cargoModel.listarPermissoes()
        .then((resultado) => {
            res.status(200).json(resultado);
        })
        .catch((erro) => {
            console.error("Erro ao listar permissões:", erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}


function listarPermissoesPorCargo(req, res) {
    const idCargo = req.params.idCargo;

    cargoModel.listarPermissoesPorCargo(idCargo)
        .then((resultado) => {
            res.status(200).json(resultado);
        })
        .catch((erro) => {
            console.error("Erro ao listar permissões por cargo:", erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}

function adicionarPermissaoCargo(req, res) {
    const { idCargo, idPermissao } = req.body;

    if (!idCargo || !idPermissao) {
        return res.status(400).json({ erro: "Dados insuficientes para adicionar permissão." });
    }

    cargoModel.adicionarPermissaoCargo(idCargo, idPermissao)
        .then(() => {
            res.status(201).json({ mensagem: "Permissão adicionada com sucesso!" });
        })
        .catch((erro) => {
            console.error("Erro ao adicionar permissão ao cargo:", erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}

function removerPermissaoCargo(req, res) {
    const idCargo = req.params.idCargo;
    const idPermissao = req.params.idPermissao;

    cargoModel.removerPermissaoCargo(idCargo, idPermissao)
        .then(() => res.status(200).json({ mensagem: "Permissão removida com sucesso!" }))
        .catch((erro) => {
            console.error("Erro ao remover permissão do cargo:", erro);
            res.status(500).json({ erro: erro.sqlMessage });
        });
}


module.exports = {
    cadastrarCargo,
    listarCargos,
    removerCargo,
    listarPermissoes,
    listarPermissoesPorCargo,
    adicionarPermissaoCargo,
    removerPermissaoCargo
};
