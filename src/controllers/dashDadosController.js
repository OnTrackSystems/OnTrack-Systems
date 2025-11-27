let dashDadosModel = require("../models/dashDadosModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

async function getJsonDashDados(req, res){
    let idGaragem = req.params.idGaragem;

    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId:"",
            secretAccessKey:"",
            sessionToken:""
        }
    });

    const input = {
        Bucket: "s3-client-ontracksystems",
        Key: `idGaragem=${idGaragem}/dashboard_${idGaragem}.json`
    }

    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const bytes = await response.Body.transformToByteArray();

    const jsonString = Buffer.from(bytes).toString("utf-8");
    const data = JSON.parse(jsonString);

    console.log(data)
    return res.status(200).json(data)
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}