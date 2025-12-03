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
        region: "us-east-1"
    });

    // Mapeamento: Frontend pede X -> Backend busca arquivo otimizado
    let nomeArquivo;
    switch (periodo) {
        case '24h':
            nomeArquivo = 'summary_48h.json'; // Já processado com variação
            break;
        case '7d':
            nomeArquivo = 'summary_14d.json'; // Já processado com variação
            break;
        case '30d':
            nomeArquivo = 'summary_60d.json'; // Já processado com variação
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

        // O Lambda já calculou tudo: KPIs, variação, alertas e otimizou os dados
        // Apenas retorna os dados prontos para o frontend
        console.log(`Sucesso: Dados otimizados carregados para ${periodo} - KPIs: ${data.kpis_resumo?.mb_total_enviado_periodo}MB, Alertas: ${data.alertas?.length || 0}`);
        
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