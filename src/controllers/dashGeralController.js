let dashDadosModel = require("../models/dashDadosModel");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;
    dashDadosModel.listarGaragens(fkEmpresa)
        .then((resultado) => res.status(200).json(resultado))
        .catch(erro => res.status(500).json(erro));
}

function getTamanhoDisco(req, res) {
    let idGaragem = req.params.idGaragem;

    dashDadosModel.getTamanhoDisco(idGaragem).then((resultado) => {
        res.status(200).json(resultado);
    });
}

async function getJsonDashDados(req, res) {
    const idGaragem = req.params.idGaragem;

    // 1. Inicializa SEM credenciais. O SDK busca automaticamente no ~/.aws/credentials
    const s3Client = new S3Client({
        region: "us-east-1"
    });

    const bucketName = "s3-client-ontracksystems"; 
    const nomeArquivo = `idGaragem=18897/dashboard_novo.json`;

    console.log(`Buscando arquivo: ${nomeArquivo} no bucket: ${bucketName}`);

    const input = {
        Bucket: bucketName,
        Key: nomeArquivo
    };

    try {
        const command = new GetObjectCommand(input);
        const response = await s3Client.send(command);

        // Transforma o stream em string e depois em JSON
        const jsonString = await response.Body.transformToString("utf-8");
        const data = JSON.parse(jsonString);

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro no S3:", error);

        if (error.name === 'NoSuchKey') {
            return res.status(404).json({ 
                mensagem: "Arquivo não encontrado no S3", 
                path: nomeArquivo 
            });
        }
        
        // Se der AccessDenied aqui, é pq o SessionToken no arquivo .aws/credentials expirou ou está errado
        return res.status(500).json({ 
            mensagem: "Erro interno no servidor", 
            erro: error.message 
        });
    }
}

async function getJsonKPIs(req, res) {
    const idGaragem = req.params.idGaragem;

    const s3Client = new S3Client({
        region: "us-east-1"
    });

    const bucketName = "s3-client-ontracksystems"; 

    const nomeArquivo = "idGaragem=18897/relatorio_onibus.json"; 

    console.log(`[Alertas] Buscando: ${nomeArquivo}`);

    const input = {
        Bucket: bucketName,
        Key: nomeArquivo
    };

    try {
        const command = new GetObjectCommand(input);
        const response = await s3Client.send(command);

        const jsonString = await response.Body.transformToString("utf-8");
        const data = JSON.parse(jsonString);

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao buscar alertas:", error);
        return res.status(500).json({ mensagem: "Erro S3 Alertas", erro: error.message });
    }
}


module.exports = {
    listarGaragens,
    getJsonDashDados,
    getJsonKPIs,
    getTamanhoDisco
}