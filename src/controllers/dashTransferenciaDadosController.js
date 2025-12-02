let dashDadosModel = require("../models/dashDadosModel");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

async function getJsonDashDados(req, res){
    let idGaragem = req.params.idGaragem;
    
    // Se o período não for informado, o padrão vai ser 24h
    let periodo = req.query.periodo || '24h'; 

    const s3Client = new S3Client({
        region: "us-east-1",
    });

    const nomeArquivo = `summary_${periodo}.json`;

    const input = {
        Bucket: "client-ontrack", 
        Key: `idGaragem=${idGaragem}/${nomeArquivo}`
    }

    try {
        const command = new GetObjectCommand(input);
        const response = await s3Client.send(command);
        const bytes = await response.Body.transformToByteArray();

        const jsonString = Buffer.from(bytes).toString("utf-8");
        const data = JSON.parse(jsonString);

        console.log(`Dados recuperados do S3 (${input.Key}):`, data);
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao buscar objeto no S3:", error);
        
        // Tratamento de erro caso o arquivo não exista
        if (error.name === 'NoSuchKey') {
            return res.status(404).json({ message: "Arquivo JSON não encontrado para esta garagem." });
        }
        
        return res.status(500).json({ message: "Erro interno ao buscar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}