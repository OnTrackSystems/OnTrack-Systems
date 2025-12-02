let dashDadosModel = require("../models/dashDadosModel");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

async function getJsonDashDados(req, res) {
    let idGaragem = req.params.idGaragem;
    let periodo = req.query.periodo || '24h';

    // Configuração do cliente S3
    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN 
        }
    });

    // Mapeamento: Frontend pede X -> Backend busca arquivo 2X
    let nomeArquivo;
    switch (periodo) {
        case '24h':
            nomeArquivo = 'summary_48h.json'; // 24h atual + 24h anterior
            break;
        case '7d':
            nomeArquivo = 'summary_14d.json'; // 7d atual + 7d anterior
            break;
        case '30d':
            nomeArquivo = 'summary_60d.json'; // 30d atual + 30d anterior
            break;
        default:
            nomeArquivo = 'summary_48h.json';
            break;
    }

    try {
        const input = {
            Bucket: "client-ontrack",
            Key: `idGaragem=${idGaragem}/${nomeArquivo}`
        };

        const command = new GetObjectCommand(input);
        const response = await s3Client.send(command);
        
        // Leitura do stream do S3
        const bytes = await response.Body.transformToByteArray();
        const jsonString = Buffer.from(bytes).toString("utf-8");
        const data = JSON.parse(jsonString);

        console.log(`Sucesso: Retornando ${nomeArquivo} para o período ${periodo}`);
        return res.status(200).json(data);

    } catch (error) {
        if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
            console.warn(`Arquivo não encontrado: ${nomeArquivo}`);
            return res.status(404).json({ message: `Dados não encontrados para o período ${periodo}` });
        }
        console.error("Erro ao buscar no S3:", error);
        return res.status(500).json({ message: "Erro interno ao processar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}