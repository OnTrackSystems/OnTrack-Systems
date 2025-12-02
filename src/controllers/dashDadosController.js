let dashDadosModel = require("../models/dashDadosModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

async function getJsonDashDados(req, res){
    let idGaragem = req.params.idGaragem;
    let periodo = req.query.periodo || '30d'; 

    const s3Client = new S3Client({
        region: "us-east-1",
    });

    // Função auxiliar para baixar JSON do S3
    const fetchJson = async (nomeArquivo) => {
        try {
            const input = {
                Bucket: "client-ontrack", 
                Key: `idGaragem=${idGaragem}/${nomeArquivo}`
            };
            const command = new GetObjectCommand(input);
            const response = await s3Client.send(command);
            const bytes = await response.Body.transformToByteArray();
            return JSON.parse(Buffer.from(bytes).toString("utf-8"));
        } catch (e) {
            return null;
        }
    };

    try {
        let data = null;

        // Lógica específica para 30 dias (usando arquivo de 60 dias)
        if (periodo === '30d') {
            data = await fetchJson('summary_60d.json');
            
            if (data && data.timeseries && data.timeseries.length > 30) {
                const lista = data.timeseries;
                
                // Separa os últimos 30 dias (Atual) e os 30 anteriores (Anterior)
                const ultimos30 = lista.slice(-30);
                const anteriores30 = lista.slice(-60, -30);

                // Calcula a proporção de volume baseada na soma de Rede_Env
                const sumAtual = ultimos30.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                const sumAnterior = anteriores30.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                const sumTotal = sumAtual + sumAnterior;

                // Distribui o total real do período (60d) proporcionalmente
                const totalReal = data.kpis_resumo.mb_total_enviado_periodo;
                const pesoAtual = sumTotal > 0 ? sumAtual / sumTotal : 0;
                const pesoAnterior = sumTotal > 0 ? sumAnterior / sumTotal : 0;

                // Atualiza KPIs
                data.kpis_resumo.mb_total_enviado_periodo = totalReal * pesoAtual;
                data.kpis_resumo.mb_total_enviado_periodo_anterior = totalReal * pesoAnterior;

                // Atualiza Timeseries para mostrar apenas os últimos 30 dias
                data.timeseries = ultimos30;
            }
        } 
        else {
            // Para 24h e 7d, busca o arquivo padrão
            data = await fetchJson(`summary_${periodo}.json`);

            if (data) {
                // Tenta buscar histórico (60d) para calcular variação
                const historico = await fetchJson('summary_60d.json');
                
                if (historico && historico.timeseries && historico.timeseries.length >= 14) {
                    const lista = historico.timeseries;
                    let razao = 1;

                    if (periodo === '24h') {
                        // Compara o último dia completo com o penúltimo
                        // (Ou os dois últimos pontos disponíveis no histórico diário)
                        const valorAtual = lista[lista.length - 1].Rede_Env || 0;
                        const valorAnterior = lista[lista.length - 2].Rede_Env || 0;
                        
                        if (valorAnterior > 0) razao = valorAtual / valorAnterior;
                    } 
                    else if (periodo === '7d') {
                        // Compara a soma dos últimos 7 dias com os 7 dias anteriores
                        const ultimos7 = lista.slice(-7);
                        const anteriores7 = lista.slice(-14, -7);

                        const somaAtual = ultimos7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                        const somaAnterior = anteriores7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);

                        if (somaAnterior > 0) razao = somaAtual / somaAnterior;
                    }

                    // Calcula o valor anterior estimado
                    const totalAtual = data.kpis_resumo.mb_total_enviado_periodo;
                    data.kpis_resumo.mb_total_enviado_periodo_anterior = totalAtual / razao;
                }
            }
        }

        if (!data) {
            return res.status(404).json({ message: "Arquivo JSON não encontrado para esta garagem." });
        }

        console.log(`Dados recuperados e processados (${periodo}):`, data.kpis_resumo);
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao processar dados do S3:", error);
        return res.status(500).json({ message: "Erro interno ao buscar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}