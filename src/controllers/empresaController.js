let empresaModel = require("../models/empresaModel");

function cadastrarEmpresa(req, res) {
    let nome = req.body.nomeEmpresaServer;
    let cnpj = req.body.cnpjEmpresaServer;

    empresaModel.cadastrarEmpresa(nome, cnpj).then((resultado) => {
        res.json(resultado);
    });
}

module.exports = {
    cadastrarEmpresa
}