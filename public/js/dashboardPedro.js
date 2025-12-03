// Variáveis globais para os gráficos
var throughputChart;
var correlationChart;
var distribuicaoChart;

const API_BASE_URL = "http://localhost:3333"; 
const idGaragem = sessionStorage.ID_GARAGEM || "18897";

document.addEventListener("DOMContentLoaded", () => {
    atualizarPeriodo('24h');
});

async function atualizarPeriodo(periodo) {
    atualizarBotoesAtivos(periodo);
    
    // Mostra indicador de carregamento
    mostrarCarregamento(true);

    try {
        const response = await fetch(`${API_BASE_URL}/dashTransferenciaDados/getJsonDashDados/${idGaragem}?periodo=${periodo}`);
        
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const dados = await response.json();
        
        // Dados já otimizados pelo Lambda
        const timeseries = dados.timeseries || [];
        const kpis = dados.kpis_resumo || {};
        const alertas = dados.alertas || [];

        console.log(`=== Dashboard Pedro - Período: ${periodo} ===`);
        console.log(`KPIs do backend:`, kpis);
        console.log(`Dados: ${timeseries.length} pontos, ${alertas.length} alertas`);

        // Calcula KPIs a partir dos pontos do gráfico (soma de Rede_Env em MB -> converte para GB)
        renderizarKPIsDoBackend(kpis, timeseries);
        renderizarGraficos(timeseries, periodo);
        renderizarAlertas(alertas);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        // Mostra erro visual para o usuário
        mostrarErro("Erro ao carregar dados. Tente novamente.");
    } finally {
        // Remove indicador de carregamento
        mostrarCarregamento(false);
    }
}

function mostrarCarregamento(mostrar) {
    const container = document.getElementById('container-alertas');
    if (!container) return;
    
    if (mostrar) {
        container.innerHTML = '<p class="text-sm text-gray-500">🔄 Carregando dados otimizados...</p>';
    }
}

function mostrarErro(mensagem) {
    const container = document.getElementById('container-alertas');
    if (container) {
        container.innerHTML = `<p class="text-sm text-red-500">⚠️ ${mensagem}</p>`;
    }
}

function renderizarAlertas(alertas) {
    const container = document.getElementById('container-alertas');
    if (!container) return;

    container.innerHTML = ""; // Limpa o container

    if (!alertas || alertas.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Nenhuma instabilidade detectada no período.</p>';
        return;
    }

    // Mostra até 10 alertas para não sobrecarregar a UI
    const alertasExibir = alertas.slice(0, 10);
    
    alertasExibir.forEach(alerta => {
        const div = document.createElement('div');
        // Usa as classes enviadas pelo Lambda para manter o estilo
        div.className = `flex items-center gap-4 rounded-lg border p-3 ${alerta.classes?.container || 'border-gray-200 bg-gray-50'}`;
        
        const iconeBg = alerta.classes?.iconeBg || 'bg-gray-200';
        const tituloClass = alerta.classes?.titulo || 'text-slate-900';
        const textoClass = alerta.classes?.texto || 'text-slate-600';
        
        div.innerHTML = `
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconeBg}">
                <span class="material-symbols-outlined">${alerta.icone || 'info'}</span>
            </div>
            <div class="flex flex-col">
                <p class="font-semibold ${tituloClass}">${alerta.titulo}</p>
                <p class="text-sm ${textoClass}">${alerta.mensagem}</p>
            </div>
        `;
        container.appendChild(div);
    });
    
    // Adiciona contador se há mais alertas
    if (alertas.length > 10) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'text-center text-sm text-gray-500 mt-2';
        infoDiv.textContent = `+${alertas.length - 10} alertas adicionais`;
        container.appendChild(infoDiv);
    }
}

function renderizarKPIsDoBackend(kpis, timeseries) {
    // Debug: verificar estrutura dos KPIs recebidos
    console.log('KPIs recebidos:', kpis);
    console.log('Timeseries recebida:', timeseries?.length, 'pontos');
    
    // CÁLCULO PRINCIPAL: Soma dos pontos do gráfico (Rede_Env em MB) e converte para GB
    // Isso garante que a KPI seja exatamente a soma do que é mostrado no gráfico
    let totalAtualMB = 0;
    if (timeseries && timeseries.length > 0) {
        totalAtualMB = timeseries.reduce((acc, ponto) => acc + (Number(ponto.Rede_Env) || 0), 0);
    }
    const totalAtualGB = totalAtualMB / 1024;
    
    // Volume anterior vem do backend (já calculado pelo Lambda)
    // IMPORTANTE: Se o backend ainda envia valores altos, significa que está em MB e precisa converter
    let totalAnteriorGB = kpis.gb_total_enviado_periodo_anterior || 0;
    
    // Verifica se o valor parece estar em MB (muito alto para ser GB)
    // Se totalAnteriorGB > 1000, provavelmente está em MB e precisa dividir por 1024
    if (totalAnteriorGB > 1000) {
        console.log('⚠️ Valor anterior muito alto, convertendo de MB para GB');
        totalAnteriorGB = totalAnteriorGB / 1024;
    }
    
    // Fallback: Se o backend ainda envia em MB (formato antigo), converte
    if (totalAnteriorGB === 0 && kpis.mb_total_enviado_periodo_anterior) {
        totalAnteriorGB = kpis.mb_total_enviado_periodo_anterior / 1024;
    }

    console.log(`📊 Volume Atual (soma gráfico): ${totalAtualMB.toFixed(2)} MB = ${totalAtualGB.toFixed(2)} GB`);
    console.log(`📊 Volume Anterior (backend): ${totalAnteriorGB.toFixed(2)} GB`);

    // KPI Principal
    const elTotal = document.getElementById('kpiTotalTransferido');
    if(elTotal) {
        const valorExibir = totalAtualGB > 0 ? totalAtualGB.toFixed(2) + " GB" : "--";
        elTotal.innerText = valorExibir;
    }

    // Cálculo da Variação
    const diferencaGB = totalAtualGB - totalAnteriorGB;
    let percentual = 0;
    
    if (totalAnteriorGB > 0) {
        percentual = (diferencaGB / totalAnteriorGB) * 100;
    } else if (totalAtualGB > 0) {
        percentual = 100;
    }

    const sinal = diferencaGB >= 0 ? "+" : "";
    const cor = diferencaGB >= 0 ? "text-green-500" : "text-red-500";
    const icone = diferencaGB >= 0 ? "↑" : "↓";
    
    const textoDiferencaGB = `${sinal}${diferencaGB.toFixed(2)} GB`;
    const textoPercentual = `${sinal}${percentual.toFixed(1)}%`;

    // KPI 1 Subtexto
    const elSub1 = document.getElementById('kpiVariacaoTransferido');
    if(elSub1) {
        if (totalAtualGB > 0) {
            elSub1.innerHTML = `<span class="${cor} font-bold">${icone} ${textoDiferencaGB}</span> vs período anterior`;
        } else {
            elSub1.innerHTML = '<span class="text-gray-500">Aguardando dados...</span>';
        }
    }

    // KPI 2
    const kpi2Valor = document.getElementById('kpiValorVariacao');
    const kpi2Sub = document.getElementById('kpiPercentualVariacao');
    
    if(kpi2Valor) {
        if (totalAtualGB > 0) {
            kpi2Valor.innerText = textoDiferencaGB;
            kpi2Valor.className = `text-3xl font-bold mt-1 ${cor}`;
        } else {
            kpi2Valor.innerText = "--";
            kpi2Valor.className = 'text-3xl font-bold mt-1 text-gray-400';
        }
    }
    if(kpi2Sub) {
        if (totalAtualGB > 0) {
            kpi2Sub.innerHTML = `<span class="${cor}">${icone} ${textoPercentual}</span> de variação`;
        } else {
            kpi2Sub.innerHTML = '<span class="text-gray-500">Aguardando dados...</span>';
        }
    }

    // Última Atualização (Pode vir do backend ou ser o momento atual)
    const elUltima = document.getElementById('kpiUltimaAtualizacao');
    if (elUltima) {
        const hoje = new Date();
        elUltima.innerText = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')} - ${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}`;
    }
}

function renderizarGraficos(lista, periodo) {
    if (!lista || lista.length === 0) return;

    // Dados já vêm otimizados do Lambda, não precisamos de amostragem adicional
    console.log(`Renderizando gráficos - Período: ${periodo}, Pontos: ${lista.length}`);

    // --- GERAÇÃO DE LABELS OTIMIZADAS ---
    // Lambda já entrega dados na frequência ideal para cada período
    
    const labels = lista.map((ponto, index) => {
        // Usa timestamp real do ponto quando disponível
        if (ponto.timestamp) {
            try {
                const dt = new Date(ponto.timestamp);
                if (periodo === '24h') {
                    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                } else {
                    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                }
            } catch (e) {
                // Fallback para geração automática se timestamp for inválido
            }
        }
        
        // Fallback: geração automática de labels
        const hoje = new Date();
        const totalPontos = lista.length;
        const iInvertido = totalPontos - 1 - index;
        const dataPonto = new Date();
        
        if (periodo === '24h') {
            // Distribui 24 horas entre os pontos
            const horasParaVoltar = (24 / totalPontos) * iInvertido;
            dataPonto.setMinutes(hoje.getMinutes() - (horasParaVoltar * 60));
            return dataPonto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (periodo === '7d') {
            // Distribui 7 dias entre os pontos
            const diasParaVoltar = (7 / totalPontos) * iInvertido;
            dataPonto.setHours(hoje.getHours() - (diasParaVoltar * 24));
            return dataPonto.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
            // Distribui 30 dias entre os pontos
            const diasParaVoltar = (30 / totalPontos) * iInvertido;
            dataPonto.setHours(hoje.getHours() - (diasParaVoltar * 24));
            return dataPonto.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    });

    const dataThroughput = lista.map(item => Number(item.Rede_Env || 0));
    const dataCPU = lista.map(item => Number(item.CPU || 0)); 

    // Define número de ticks no eixo X baseado no período
    let tickAmount;
    if (periodo === '24h') {
        tickAmount = Math.min(12, lista.length); // Máximo 12 labels para 24h
    } else if (periodo === '7d') {
        tickAmount = Math.min(14, lista.length); // Máximo 14 labels para 7d
    } else { // 30d
        tickAmount = Math.min(15, lista.length); // Máximo 15 labels para 30d
    }

    // --- GRÁFICO 1: Throughput ---
    const optionsThroughput = {
        series: [{ name: 'Envio (MB)', data: dataThroughput }],
        chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { 
            categories: labels, 
            tickAmount: tickAmount, 
            labels: { 
                rotate: -45, 
                style: { fontSize: '11px' },
                maxHeight: 60
            } 
        },
        yaxis: { title: { text: 'Megabytes (MB)' } },
        colors: ['#2563EB'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] } },
        tooltip: { y: { formatter: (val) => val.toFixed(2) + " MB" } }
    };

    if (throughputChart) {
        throughputChart.updateOptions({
            series: [{ data: dataThroughput }],
            xaxis: { 
                categories: labels,
                tickAmount: tickAmount,
                labels: { 
                    rotate: -45, 
                    style: { fontSize: '11px' },
                    maxHeight: 60
                }
            }
        });
    } else {
        const el = document.querySelector("#chart-throughput");
        if(el) {
            throughputChart = new ApexCharts(el, optionsThroughput);
            throughputChart.render();
        }
    }

    // --- GRÁFICO 2: Correlação ---
    const optionsCorrelation = {
        series: [{ name: 'Rede (MB)', type: 'column', data: dataThroughput }, { name: 'Uso CPU (%)', type: 'line', data: dataCPU }],
        chart: { height: 350, type: 'line', toolbar: { show: false } },
        stroke: { width: [0, 3] },
        dataLabels: { enabled: false },
        labels: labels,
        xaxis: {
            tickAmount: tickAmount,
            labels: { 
                rotate: -45, 
                style: { fontSize: '11px' },
                maxHeight: 60
            }
        },
        yaxis: [{ title: { text: 'Rede (MB)' } }, { opposite: true, title: { text: 'CPU (%)' }, max: 100 }],
        colors: ['#2563EB', '#DC3545'],
    };

    if (correlationChart) {
        correlationChart.updateOptions({
            series: [{ data: dataThroughput }, { data: dataCPU }],
            labels: labels,
            xaxis: {
                tickAmount: tickAmount,
                labels: { 
                    rotate: -45, 
                    style: { fontSize: '11px' },
                    maxHeight: 60
                }
            }
        });
    } else {
        const el = document.querySelector("#chart-correlation");
        if(el) {
            correlationChart = new ApexCharts(el, optionsCorrelation);
            correlationChart.render();
        }
    }

    // --- GRÁFICO 3: Distribuição (usa dados originais para análise completa) ---
    const todosValoresThroughput = lista.map(item => Number(item.Rede_Env || 0));
    let baixo = 0, medio = 0, alto = 0, pico = 0;
    todosValoresThroughput.forEach(valor => {
        if (valor < 10) baixo++;
        else if (valor < 20) medio++;
        else if (valor < 30) alto++;
        else pico++;
    });

    const optionsDist = {
        series: [{ name: 'Ocorrências', data: [baixo, medio, alto, pico] }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
        xaxis: { categories: ['Baixo (<10MB)', 'Médio (10-20MB)', 'Alto (20-30MB)', 'Pico (>30MB)'] },
        colors: ['#2563EB']
    };

    if (distribuicaoChart) {
        distribuicaoChart.updateOptions({ series: [{ data: [baixo, medio, alto, pico] }] });
    } else {
        const el = document.querySelector("#chart-distribuicao");
        if(el) {
            distribuicaoChart = new ApexCharts(el, optionsDist);
            distribuicaoChart.render();
        }
    }
}

function atualizarBotoesAtivos(periodoSelecionado) {
    // Remove classes ativas de todos os botões
    const todosBotoes = ['btn-kpi-24h', 'btn-kpi-7d', 'btn-kpi-30d'];
    todosBotoes.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-slate-100', 'text-gray-700');
        }
    });
    
    // Adiciona classe ativa ao botão selecionado
    let botaoAtivo;
    switch (periodoSelecionado) {
        case '24h':
            botaoAtivo = document.getElementById('btn-kpi-24h');
            break;
        case '7d':
            botaoAtivo = document.getElementById('btn-kpi-7d');
            break;
        case '30d':
            botaoAtivo = document.getElementById('btn-kpi-30d');
            break;
    }
    
    if (botaoAtivo) {
        botaoAtivo.classList.remove('bg-slate-100', 'text-gray-700');
        botaoAtivo.classList.add('bg-primary', 'text-white');
    }
}

function atualizarGrafico(periodo) {
    atualizarPeriodo(periodo);
}