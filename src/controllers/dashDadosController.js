let dashDadosModel = require("../models/dashDadosModel");

function listarGaragens(req, res) {
    let fkEmpresa = req.params.fkEmpresa;

    dashDadosModel.listarGaragens(fkEmpresa).then((resultado) => {
        res.status(200).json(resultado);
    });
}

function getTamanhoDisco(req, res) {
    let idGaragem = req.params.idGaragem;

    dashDadosModel.getTamanhoDisco(idGaragem).then((resultado) => {
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
        } else {
            // Para 24h e 7d, busca o arquivo padrão
            data = await fetchJson(`summary_${periodo}.json`);

            if (data) {
                // Tenta buscar histórico para calcular variação
                // Tenta primeiro o de 14 dias (melhor resolução - 4h), depois o de 60 dias (diário)
                let historico = await fetchJson('summary_14d.json');
                let usou14d = true;

                if (!historico) {
                    console.log("summary_14d.json não encontrado, tentando summary_60d.json");
                    historico = await fetchJson('summary_60d.json');
                    usou14d = false;
                }

                if (historico && historico.timeseries) {
                    const lista = historico.timeseries;
                    let razao = 1;
                    let calculou = false;

                    if (usou14d) {
                        // Lógica para summary_14d.json (intervalos de 4h)
                        // 24h = 6 pontos (6 * 4h = 24h)
                        // 7d = 42 pontos (42 * 4h = 168h = 7d)
                        const pontosNecessarios = periodo === '24h' ? 6 : 42;
                        
                        if (lista.length >= pontosNecessarios * 2) {
                            const ultimos = lista.slice(-pontosNecessarios);
                            const anteriores = lista.slice(-pontosNecessarios * 2, -pontosNecessarios);

                            const somaAtual = ultimos.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                            const somaAnterior = anteriores.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);

                            console.log(`[14d] Soma Atual (${pontosNecessarios} pts): ${somaAtual.toFixed(2)} | Soma Anterior: ${somaAnterior.toFixed(2)}`);

                            if (somaAnterior > 0) {
                                razao = somaAtual / somaAnterior;
                                calculou = true;
                            }
                        }
                    } 
                    else {
                        // Lógica para summary_60d.json (intervalos diários)
                        // Verifica se tem histórico suficiente
                        const temHistoricoSuficiente = (periodo === '24h' && lista.length >= 2) ||
                                                       (periodo === '7d' && lista.length >= 14);

                        if (temHistoricoSuficiente) {
                            if (periodo === '24h') {
                                // Compara o último dia completo com o penúltimo
                                const valorAtual = lista[lista.length - 1].Rede_Env || 0;
                                const valorAnterior = lista[lista.length - 2].Rede_Env || 0;
                                
                                console.log(`[60d] Valor Atual (Dia): ${valorAtual} | Valor Anterior: ${valorAnterior}`);

                                if (valorAnterior > 0) {
                                    razao = valorAtual / valorAnterior;
                                    calculou = true;
                                }
                            } 
                            else if (periodo === '7d') {
                                // Compara a soma dos últimos 7 dias com os 7 dias anteriores
                                const ultimos7 = lista.slice(-7);
                                const anteriores7 = lista.slice(-14, -7);

                                const somaAtual = ultimos7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);
                                const somaAnterior = anteriores7.reduce((acc, item) => acc + (item.Rede_Env || 0), 0);

                                console.log(`[60d] Soma Atual (7d): ${somaAtual.toFixed(2)} | Soma Anterior: ${somaAnterior.toFixed(2)}`);

                                if (somaAnterior > 0) {
                                    razao = somaAtual / somaAnterior;
                                    calculou = true;
                                }
                            }
                        }
                    }

                    // Calcula o valor anterior estimado
                    if (calculou) {
                        const totalAtual = data.kpis_resumo.mb_total_enviado_periodo;
                        data.kpis_resumo.mb_total_enviado_periodo_anterior = totalAtual / razao;
                        console.log(`Razão calculada: ${razao.toFixed(4)} | Anterior Estimado: ${data.kpis_resumo.mb_total_enviado_periodo_anterior}`);
                    } else {
                        console.log("Não foi possível calcular a variação (dados insuficientes ou zero).");
                    }
                } else {
                    console.log("Nenhum arquivo de histórico encontrado (14d ou 60d).");
                }
            }
        }

        if (!data) {
            return res.status(404).json({ message: "Arquivo JSON não encontrado para esta garagem." });
        }

        // --- GERAÇÃO DE ALERTAS DINÂMICOS ---
        // Analisa a timeseries para gerar alertas de instabilidade
        const alertas = [];
        const series = data.timeseries || [];

        // Ordena por timestamp para garantir a ordem cronológica
        series.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Função auxiliar para obter o valor de envio em MB do ponto, considerando diferentes nomes de campos
        const getValorEnvioMB = (ponto) => {
            // Prioriza campos mais comuns, cai para alternativas se necessário
            const candidatos = [
                'Rede_Env',            // nome usado atualmente
                'MB_Enviados_Seg',     // usado na simulação granular
                'MB_Env',              // variações possíveis
                'envio_mb',            // snake-case possível
                'mb_env',              // abreviações
            ];
            for (const key of candidatos) {
                if (ponto[key] !== undefined && ponto[key] !== null) {
                    const val = Number(ponto[key]);
                    if (!Number.isNaN(val)) return val;
                }
            }
            // Último recurso: tenta um campo genérico "valor" ou retorna 0
            if (ponto.valor !== undefined) {
                const v = Number(ponto.valor);
                if (!Number.isNaN(v)) return v;
            }
            return 0;
        };

        let countCritico = 0;
        let countBaixo = 0;

        for (let i = 0; i < series.length; i++) {
            const atual = series[i];
            const anterior = i > 0 ? series[i - 1] : null;

            const redeAtual = getValorEnvioMB(atual);
            const redeAnterior = anterior ? getValorEnvioMB(anterior) : null;

            const dataHora = new Date(atual.timestamp);
            const horaFormatada = isNaN(dataHora.getTime())
                ? (typeof atual.timestamp === 'string' ? atual.timestamp : `#${i}`)
                : dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // Regra 1: Throughput Crítico (<= 1 MB)
            if (redeAtual <= 1) {
                countCritico++;
                alertas.push({
                    tipo: "danger",
                    titulo: "Throughput Crítico",
                    mensagem: `Envio crítico (${redeAtual.toFixed(2)} MB) detectado às ${horaFormatada}.`,
                    timestamp: atual.timestamp || `${i}`,
                    icone: "error",
                    classes: {
                        container: "border-danger/50 bg-danger/10",
                        iconeBg: "bg-danger/20 text-danger",
                        titulo: "text-slate-900 dark:text-white",
                        texto: "text-slate-600 dark:text-slate-400"
                    }
                });
            }
            // Regra 2: Throughput Baixo (< 5 MB)
            else if (redeAtual < 5) {
                countBaixo++;
                alertas.push({
                    tipo: "warning",
                    titulo: "Throughput Baixo",
                    mensagem: `Envio abaixo do ideal (${redeAtual.toFixed(2)} MB) às ${horaFormatada}.`,
                    timestamp: atual.timestamp || `${i}`,
                    icone: "warning",
                    classes: {
                        container: "border-warning/50 bg-warning/10",
                        iconeBg: "bg-warning/20 text-warning",
                        titulo: "text-slate-900 dark:text-white",
                        texto: "text-slate-600 dark:text-slate-400"
                    }
                });
            }

            // Regra 3: Conexão Restaurada (Crítico -> Normal)
            if (redeAnterior !== null && redeAnterior <= 1 && redeAtual > 5) {
                alertas.push({
                    tipo: "success",
                    titulo: "Conexão Restaurada",
                    mensagem: `Estabilidade normalizada às ${horaFormatada}.` ,
                    timestamp: atual.timestamp || `${i}`,
                    icone: "task_alt",
                    classes: {
                        container: "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800",
                        iconeBg: "bg-success/20 text-success",
                        titulo: "text-slate-900 dark:text-white",
                        texto: "text-slate-600 dark:text-slate-400"
                    }
                });
            }
        }

        console.log(`Alertas gerados -> Critico: ${countCritico}, Baixo: ${countBaixo}, Total: ${alertas.length}`);
        console.log(`Período: ${periodo}, Total de pontos analisados: ${series.length}`);
        
        // Debug: mostra alguns valores de Rede_Env para verificar
        if (series.length > 0) {
            console.log(`Primeiros 5 valores Rede_Env: ${series.slice(0, 5).map(p => getValorEnvioMB(p)).join(', ')}`);
            const baixos = series.filter(p => getValorEnvioMB(p) < 5);
            console.log(`Total de pontos < 5MB: ${baixos.length}`);
        }

        // Retorna alertas do período em ordem cronológica; limita a 50 para performance
        data.alertas = alertas
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(0, 50);

        console.log(`Dados recuperados e processados (${periodo}):`, data.kpis_resumo);
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao processar dados do S3:", error);
        return res.status(500).json({ message: "Erro interno ao buscar dados.", error: error.message });
    }
}

module.exports = {
    listarGaragens,
    getJsonDashDados,
    getTamanhoDisco
}