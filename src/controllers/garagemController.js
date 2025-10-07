var garagemModel = require("../models/garagemModel");

function adicionarGaragem(req, res) {
    let idGaragem = req.body.idGaragem;
    let nomeGaragem = req.body.nome;
    let latitudeGaragem = req.body.latitude;
    let longitudeGaragem = req.body.longitude;
    let fkEmpresa = req.body.idEmpresa;

    garagemModel.adicionarGaragem(idGaragem, nomeGaragem, latitudeGaragem, longitudeGaragem, fkEmpresa).then((resultado) => {
        res.status(200).send(`✅ Garagem ${nomeGaragem} cadastrada com sucesso!`);
    });
}

function verificarGaragemNome(req, res) {
    let nomeGaragem = req.params.nome;

    garagemModel.verificarGaragemNome(nomeGaragem).then((resultado) => {
        if(resultado.length > 0) {
            return false;
        }

        return true;
    });
}

module.exports = {
    adicionarGaragem,
    verificarGaragemNome
}