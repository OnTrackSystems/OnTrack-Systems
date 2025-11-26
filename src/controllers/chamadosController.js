let chamadosModel = require("../models/chamadosModel");

function listarChamados(req,res){
    chamadosModel.buscarChamados().then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

async function getCallsFromBucket(req, res){
    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            // é string mas qnd for subir p ec2 da pra colocar var de ambiente!!
            accessKeyId:"",
            secretAccessKey:"",
            sessionToken:""
        }
    });

    const input = {
        Bucket: "awsontrackclient",
        Key: "chamados_dashboard.json"
    }

    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const bytes = await response.Body.transformToByteArray();

    const jsonString = Buffer.from(bytes).toString("utf-8");
    const data = JSON.parse(jsonString);

    console.log(data)
    return res.status(200).json(data)
}

module.exports={
    getCallsFromBucket,
    listarChamados
}