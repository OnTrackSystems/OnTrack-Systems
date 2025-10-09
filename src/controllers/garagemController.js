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

function verificarGaragemId(req, res) {
    let idGaragem = req.params.idGaragem;

    garagemModel.verificarGaragemId(idGaragem).then((resultado) => {
        if(resultado.length > 0) {
            res.status(200).send("true");
        } else {
            res.status(400).send("false");
        }
    });
}

module.exports = {
    adicionarGaragem,
    verificarGaragemId
}