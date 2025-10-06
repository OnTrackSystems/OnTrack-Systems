var garagemModel = require("../models/garagemModel");

function adicionarGaragem(req, res) {
    let idGaragem = req.body.garagemIdServer;
    let nomeGaragem = req.body.garagemNomeServer;
    let latitudeGaragem = req.body.garagemLatitudeServer;
    let longitudeGaragem = req.body.garagemLongitudeServer;

    garagemModel.adicionarGaragem(idGaragem, nomeGaragem, latitudeGaragem, longitudeGaragem).then((resultado) => {
        res.status(200).send(`✅ Garagem ${nomeGaragem} cadastrada com sucesso!`);
    })
}

module.exports = {
    adicionarGaragem
}