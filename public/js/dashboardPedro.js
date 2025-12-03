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

    try {
        const response = await fetch(`${API_BASE_URL}/dashTransferenciaDados/getJsonDashDados/${idGaragem}?periodo=${periodo}`);
        
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const dados = await response.json();
        
        // Usa os dados processados pelo backend
        const timeseries = dados.timeseries || [];
        const kpis = dados.kpis_resumo || {};
        const alertas = dados.alertas || [];

        console.log(`=== Período: ${periodo} ===`);
        console.log('KPIs recebidas:', kpis);
        console.log('Alertas recebidos:', alertas);

        renderizarKPIsDoBackend(kpis);
        renderizarGraficos(timeseries, periodo);
        renderizarAlertas(alertas);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

function renderizarAlertas(alertas) {
    const container = document.getElementById('container-alertas');
    if (!container) return;

    container.innerHTML = ""; // Limpa o container

    if (alertas.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Nenhuma instabilidade detectada no período.</p>';
        return;
    }

    alertas.forEach(alerta => {
        const div = document.createElement('div');
        // Usa as classes enviadas pelo backend para manter o estilo
        div.className = `flex items-center gap-4 rounded-lg border p-3 ${alerta.classes.container}`;
        
        div.innerHTML = `
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alerta.classes.iconeBg}">
                <span class="material-symbols-outlined">${alerta.icone}</span>
            </div>
            <div class="flex flex-col">
                <p class="font-semibold ${alerta.classes.titulo}">${alerta.titulo}</p>
                <p class="text-sm ${alerta.classes.texto}">${alerta.mensagem}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderizarKPIsDoBackend(kpis) {
    // 1. Volume Total (Vem direto do JSON, calculado corretamente no backend)
    const totalAtualMB = kpis.mb_total_enviado_periodo || 0;
    const totalAnteriorMB = kpis.mb_total_enviado_periodo_anterior || 0;
    
    const totalAtualGB = totalAtualMB / 1024;
    const totalAnteriorGB = totalAnteriorMB / 1024;

    // KPI Principal
    const elTotal = document.getElementById('kpiTotalTransferido');
    if(elTotal) elTotal.innerText = totalAtualGB.toFixed(2) + " GB";

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
    if(elSub1) elSub1.innerHTML = `<span class="${cor} font-bold">${icone} ${textoDiferencaGB}</span> vs período anterior`;

    // KPI 2
    const kpi2Valor = document.getElementById('kpiValorVariacao');
    const kpi2Sub = document.getElementById('kpiPercentualVariacao');
    
    if(kpi2Valor) {
        kpi2Valor.innerText = textoDiferencaGB;
        kpi2Valor.className = `text-3xl font-bold mt-1 ${cor}`;
    }
    if(kpi2Sub) {
        kpi2Sub.innerHTML = `<span class="${cor}">${icone} ${textoPercentual}</span> de variação`;
    }

    // Última Atualização (Pode vir do backend ou ser o momento atual)
    const elUltima = document.getElementById('kpiUltimaAtualizacao');
    if (elUltima) {
        const hoje = new Date();
        elUltima.innerText = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')} - ${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}`;
    }
}

// Função para reduzir pontos nos gráficos para melhor visualização
function amostrarDados(lista, periodo) {
    if (!lista || lista.length === 0) return [];
    
    let maxPontos;
    let intervalo;
    
    // Define quantos pontos mostrar baseado no período
    if (periodo === '24h') {
        maxPontos = Math.min(lista.length, 24); // Máximo 24 pontos (1 por hora)
    } else if (periodo === '7d') {
        maxPontos = Math.min(lista.length, 28); // Máximo 28 pontos (4 por dia)
    } else { // 30d
        maxPontos = Math.min(lista.length, 30); // Máximo 30 pontos (1 por dia)
    }
    
    // Se já temos poucos pontos, retorna todos
    if (lista.length <= maxPontos) {
        return lista;
    }
    
    // Calcula o intervalo de amostragem
    intervalo = Math.floor(lista.length / maxPontos);
    
    // Cria array com pontos amostrados
    const dadosAmostrados = [];
    for (let i = 0; i < lista.length; i += intervalo) {
        dadosAmostrados.push(lista[i]);
    }
    
    // Garante que o último ponto seja sempre incluído
    if (dadosAmostrados[dadosAmostrados.length - 1] !== lista[lista.length - 1]) {
        dadosAmostrados.push(lista[lista.length - 1]);
    }
    
    return dadosAmostrados;
}

function renderizarGraficos(lista, periodo) {
    if (!lista || lista.length === 0) return;

    // Aplica amostragem para melhorar visualização
    const listaAmostrada = amostrarDados(lista, periodo);
    console.log(`Período: ${periodo}, Pontos originais: ${lista.length}, Pontos após amostragem: ${listaAmostrada.length}`);

    // --- GERAÇÃO DE LABELS PROPORCIONAL ---
    // Distribui o tempo total do período pelo número de pontos disponíveis.
    
    const labels = listaAmostrada.map((_, index) => {
        const hoje = new Date();
        const totalPontos = listaAmostrada.length;
        // Índice invertido: 0 é "agora", totalPontos-1 é o mais antigo
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

    const dataThroughput = listaAmostrada.map(item => Number(item.Rede_Env || 0));
    const dataCPU = listaAmostrada.map(item => Number(item.CPU || 0)); 

    // Define número de ticks no eixo X baseado no período para melhor legibilidade
    let tickAmount;
    if (periodo === '24h') {
        tickAmount = Math.min(8, listaAmostrada.length); // Máximo 8 labels
    } else if (periodo === '7d') {
        tickAmount = Math.min(7, listaAmostrada.length); // Máximo 7 labels
    } else { // 30d
        tickAmount = Math.min(10, listaAmostrada.length); // Máximo 10 labels
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
    const botoes = document.querySelectorAll('[data-periodo]');
    botoes.forEach(btn => {
        const periodo = btn.getAttribute('data-periodo');
        if (periodo === periodoSelecionado) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
}

function atualizarGrafico(periodo) {
    atualizarPeriodo(periodo);
}