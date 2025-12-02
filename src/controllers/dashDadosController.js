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
    let periodo = req.query.periodo || '24h'; 

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
            // Se não achar, retorna null sem estourar erro na resposta principal ainda
            return null;
        }
    };

    try {
        // 1. Busca o arquivo principal (ex: summary_24h.json)
        let dataPrincipal = await fetchJson(`summary_${periodo}.json`);

        if (!dataPrincipal) {
            return res.status(404).json({ message: "Arquivo JSON não encontrado para esta garagem." });
        }

        // 2. Cálculo do "período anterior" usando summary_30d.json como base histórica
        // Só faz sentido para 24h e 7d, pois 30d precisaria de 60d de histórico
        if (periodo === '24h' || periodo === '7d') {
            const data30d = await fetchJson('summary_30d.json');

            if (data30d && data30d.timeseries && data30d.timeseries.length >= 2) {
                const lista = data30d.timeseries;
                let razao = 1;

                if (periodo === '24h') {
                    // Compara o último ponto (hoje/ontem recente) com o penúltimo
                    const valorAtual = lista[lista.length - 1].Rede_Env || 0;
                    const valorAnterior = lista[lista.length - 2].Rede_Env || 0;
                    
                    // Se o valor anterior for 0, evitamos divisão por zero mantendo razão 1 (sem variação)
                    if (valorAnterior > 0) {
                        razao = valorAtual / valorAnterior;
                    }
                } 
                else if (periodo === '7d' && lista.length >= 14) {
                    // Compara a soma dos últimos 7 dias com os 7 dias anteriores a esses
                    const ultimos7 = lista.slice(-7);
                    const anteriores7 = lista.slice(-14, -7);

                    const somaAtual = ultimos7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                    const somaAnterior = anteriores7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);

                    if (somaAnterior > 0) {
                        razao = somaAtual / somaAnterior;
                    }
                }

                // Aplica a razão inversa para descobrir quanto seria o "total anterior"
                // Ex: Se hoje (100) é dobro de ontem (50), razão = 2. 
                // Se total atual é 1000, total anterior estimado seria 1000 / 2 = 500.
                const totalAtual = dataPrincipal.kpis_resumo.mb_total_enviado_periodo;
                dataPrincipal.kpis_resumo.mb_total_enviado_periodo_anterior = totalAtual / razao;
            }
        }

        console.log(`Dados recuperados e processados (${periodo}):`, dataPrincipal.kpis_resumo);
        return res.status(200).json(dataPrincipal);

    } catch (error) {
        console.error("Erro ao processar dados do S3:", error);
        return res.status(500).json({ message: "Erro interno ao buscar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados
}