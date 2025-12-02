let dashDadosModel = require("../models/preditivaModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

async function JsonPreditiva(req, res) {
    let idGaragem = req.query.idGaragem;

    let arquivoKey = "dashboard_data.json";
    if (idGaragem && idGaragem !== 'all') {
        arquivoKey = `dashboard_${idGaragem}.json`;
    }

    console.log(`Buscando arquivo: ${arquivoKey}`);

    const s3Client = new S3Client({
        region: "us-east-1"
    });

    const input = {
        Bucket: "s3-client-ontracksystems",
        Key: arquivoKey
    }

    try {
        const command = new GetObjectCommand(input);
        const response = await s3Client.send(command);
        const bytes = await response.Body.transformToByteArray();

        const jsonString = Buffer.from(bytes).toString("utf-8");
        const data = JSON.parse(jsonString);

        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro S3:", error);
        if (idGaragem && idGaragem !== 'all') {
            console.log("Tentando fallback...");
            req.query.idGaragem = 'all';
            return JsonPreditiva(req, res);
        }
        return res.status(500).json({ error: "Falha ao buscar dados" });
    }
}

module.exports = {
    listarGaragens,
    JsonPreditiva
}                                                                                                                                                                   