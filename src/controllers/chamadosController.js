let chamadosModel = require("../models/chamadosModel");

function listarChamados(req,res){
    chamadosModel.buscarChamados().then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3'); // requisitando o pacote

async function getCallsFromBucket(req, res){
    
    const s3Client = new S3Client({
        region: "us-east-1",
         credentials: {
            accessKeyId: "",
            secretAccessKey: "",
            sessionToken: ""
        } // tem que configuar isso aq pra puxar do bucket
    });

    const input = {
        Bucket: "awsontrackclient",  // nome do bucket
        Key: "chamados_dashboard.json" // nome do arquivo que voce esta puxando do bucket
    }

    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const bytes = await response.Body.transformToByteArray();

    const jsonString = Buffer.from(bytes).toString("utf-8");
    const data = JSON.parse(jsonString); // essa variável "data", é o nome do json que vai vir no fetch

    // bloco acima é pra transformar do jeito que eles pegam do bucket, para json string. 
    console.log(data)
    return res.status(200).json(data)
}

async function getCallsFromBucketOpen(req, res){
    
    const s3Client = new S3Client({
        region: "us-east-1",
         credentials: {
            accessKeyId: "",
            secretAccessKey: "",
            sessionToken: ""
        } // tem que configuar isso aq pra puxar do bucket
    });

    const input = {
        Bucket: "awsontrackclient",  // nome do bucket
        Key: "chamados_abertos.json" // nome do arquivo que voce esta puxando do bucket
    }

    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const bytes = await response.Body.transformToByteArray();

    const jsonString = Buffer.from(bytes).toString("utf-8");
    const dataAberto = JSON.parse(jsonString); // essa variável "data", é o nome do json que vai vir no fetch

    // bloco acima é pra transformar do jeito que eles pegam do bucket, para json string. 
    console.log(dataAberto)
    return res.status(200).json(dataAberto)
}


module.exports={
    getCallsFromBucket,
    listarChamados,
    getCallsFromBucketOpen
}