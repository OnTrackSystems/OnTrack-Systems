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
            sessionToken: process.env.AWS_SESSION_TOKEN // Se estiver usando credenciais temporárias
        }
    });

    // Função auxiliar para buscar JSON no S3
    // Retorna o objeto JSON ou null se não existir/erro
    const fetchJson = async (nomeArquivo) => {
        const input = {
            Bucket: "client-ontrack",
            Key: `idGaragem=${idGaragem}/${nomeArquivo}`
        };

        try {
            const command = new GetObjectCommand(input);
            const response = await s3Client.send(command);
            const bytes = await response.Body.transformToByteArray();
            const jsonString = Buffer.from(bytes).toString("utf-8");
            return JSON.parse(jsonString);
        } catch (error) {
            // Se for erro de chave não encontrada, retorna null para tratarmos na lógica
            if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
                return null;
            }
            console.error(`Erro ao buscar ${nomeArquivo}:`, error);
            return null;
        }
    };

    try {
        let dataPrincipal = null;

        // --- LÓGICA ESPECIAL PARA 30 DIAS ---
        // Se for 30d, buscamos o de 60d para ter o histórico comparativo
        if (periodo === '30d') {
            let data60d = await fetchJson('summary_60d.json');

            if (data60d && data60d.timeseries && data60d.timeseries.length > 30) {
                const lista = data60d.timeseries;

                // Separa os últimos 30 dias (Atual) e os 30 anteriores (Anterior)
                const ultimos30 = lista.slice(-30);
                const anteriores30 = lista.slice(-60, -30);

                // Calcula a proporção de volume baseada na soma de Rede_Env
                const sumAtual = ultimos30.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                const sumAnterior = anteriores30.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                const sumTotal = sumAtual + sumAnterior;

                // Distribui o total real do período (que vem no KPI de 60d) proporcionalmente
                const totalReal = data60d.kpis_resumo.mb_total_enviado_periodo;
                
                // Evita divisão por zero
                const pesoAtual = sumTotal > 0 ? sumAtual / sumTotal : 0;
                const pesoAnterior = sumTotal > 0 ? sumAnterior / sumTotal : 0;

                // Atualiza KPIs no objeto que será retornado
                data60d.kpis_resumo.mb_total_enviado_periodo = totalReal * pesoAtual;
                data60d.kpis_resumo.mb_total_enviado_periodo_anterior = totalReal * pesoAnterior;

                // Atualiza Timeseries para mostrar apenas os últimos 30 dias no gráfico
                data60d.timeseries = ultimos30;

                // Define dataPrincipal como esse objeto manipulado
                dataPrincipal = data60d;
            } else {
                // Fallback: Se não conseguir processar o de 60d, tenta pegar o de 30d normal
                dataPrincipal = await fetchJson('summary_30d.json');
            }
        } 
        // --- LÓGICA PADRÃO (24h e 7d) ---
        else {
            // Busca o arquivo do período solicitado (ex: summary_24h.json)
            dataPrincipal = await fetchJson(`summary_${periodo}.json`);

            // Se achou o arquivo principal, tentamos calcular o comparativo usando o histórico de 30d
            if (dataPrincipal && (periodo === '24h' || periodo === '7d')) {
                const data30d = await fetchJson('summary_30d.json');

                if (data30d && data30d.timeseries && data30d.timeseries.length >= 14) {
                    const lista = data30d.timeseries;
                    let razao = 1;

                    if (periodo === '24h') {
                        // Lógica 24h: Compara último ponto vs penúltimo ponto do histórico de 30d
                        // (Assume que timeseries do 30d tem dados diários ou horários compatíveis)
                        const valorAtual = lista[lista.length - 1].Rede_Env || 0;
                        const valorAnterior = lista[lista.length - 2].Rede_Env || 0;

                        if (valorAnterior > 0) {
                            razao = valorAtual / valorAnterior;
                        }
                    } 
                    else if (periodo === '7d') {
                        // Lógica 7d: Compara soma dos últimos 7 vs soma dos 7 anteriores
                        const ultimos7 = lista.slice(-7);
                        const anteriores7 = lista.slice(-14, -7);

                        const somaAtual = ultimos7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                        const somaAnterior = anteriores7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);

                        if (somaAnterior > 0) {
                            razao = somaAtual / somaAnterior;
                        }
                    }

                    // Aplica a razão inversa para estimar o "total anterior" no KPI
                    // Ex: Se cresceu 2x (razao=2), o anterior era metade do atual.
                    const totalAtual = dataPrincipal.kpis_resumo.mb_total_enviado_periodo;
                    if (razao !== 0) {
                        dataPrincipal.kpis_resumo.mb_total_enviado_periodo_anterior = totalAtual / razao;
                    }
                }
            }
        }

        // Verificação final se temos dados para responder
        if (!dataPrincipal) {
            return res.status(404).json({ message: "Arquivo JSON não encontrado para esta garagem." });
        }

        console.log(`Dados processados e retornados (${periodo}) para garagem ${idGaragem}`);
        return res.status(200).json(dataPrincipal);

    } catch (error) {
        console.error("Erro crítico ao processar dados do S3:", error);
        return res.status(500).json({ message: "Erro interno ao processar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}