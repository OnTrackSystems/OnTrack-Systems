let dashDadosModel = require("../models/preditivaModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    preditivaModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

async function  JsonPreditiva(req, res){
    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId:"",
            secretAccessKey:"",
            sessionToken:""        
        }
    });

    const input = {
        Bucket: "s3-client-lab-04251122",
        Key: `dashboard_data.json`
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
    JsonPreditiva
}