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
        const todosDados = dados.timeseries || [];

        // --- LÓGICA DE CORTE (SPLIT) CORRIGIDA ---
        // O backend envia o dobro do período.
        // Para garantir que pegamos os dados mais recentes corretamente, usamos slice negativo.
        
        const totalRegistros = todosDados.length;
        const tamanhoJanela = Math.floor(totalRegistros / 2);

        // 1. Dados Atuais: Os últimos 'tamanhoJanela' registros
        const dadosAtuais = todosDados.slice(-tamanhoJanela);

        // 2. Dados Anteriores: Os registros imediatamente antes dos atuais
        const dadosAnteriores = todosDados.slice(-tamanhoJanela * 2, -tamanhoJanela);

        console.log(`=== Período: ${periodo} ===`);
        console.log(`Total: ${totalRegistros} | Janela: ${tamanhoJanela}`);
        console.log(`Atuais: ${dadosAtuais.length} | Anteriores: ${dadosAnteriores.length}`);

        renderizarKPIsCalculados(dadosAtuais, dadosAnteriores);
        renderizarGraficos(dadosAtuais, periodo);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

function renderizarKPIsCalculados(dadosAtuais, dadosAnteriores) {
    // Função auxiliar para somar (com Number() para evitar concatenação de strings)
    const somarRede = (lista) => lista.reduce((acc, item) => acc + Number(item.Rede_Env || 0), 0);

    const totalAtualMB = somarRede(dadosAtuais);
    const totalAnteriorMB = somarRede(dadosAnteriores);
    
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

    // Última Atualização
    const elUltima = document.getElementById('kpiUltimaAtualizacao');
    if (elUltima) {
        const hoje = new Date();
        elUltima.innerText = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')} - ${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}`;
    }
}

function renderizarGraficos(lista, periodo) {
    if (!lista || lista.length === 0) return;

    // --- GERAÇÃO DE LABELS PROPORCIONAL ---
    // Distribui o tempo total do período pelo número de pontos disponíveis.
    // Isso corrige o erro de plotagem quando há muitos pontos (ex: 42 pontos em 7 dias).
    
    const labels = lista.map((_, index) => {
        const hoje = new Date();
        const totalPontos = lista.length;
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

    const dataThroughput = lista.map(item => Number(item.Rede_Env || 0));
    const dataCPU = lista.map(item => Number(item.CPU || 0)); 

    // --- GRÁFICO 1: Throughput ---
    const optionsThroughput = {
        series: [{ name: 'Envio (MB)', data: dataThroughput }],
        chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: labels, tickAmount: 10, labels: { rotate: -45, style: { fontSize: '12px' } } },
        yaxis: { title: { text: 'Megabytes (MB)' } },
        colors: ['#2563EB'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] } },
        tooltip: { y: { formatter: (val) => val.toFixed(2) + " MB" } }
    };

    if (throughputChart) {
        throughputChart.updateOptions({
            series: [{ data: dataThroughput }],
            xaxis: { categories: labels }
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
        yaxis: [{ title: { text: 'Rede (MB)' } }, { opposite: true, title: { text: 'CPU (%)' }, max: 100 }],
        colors: ['#2563EB', '#DC3545'],
    };

    if (correlationChart) {
        correlationChart.updateOptions({
            series: [{ data: dataThroughput }, { data: dataCPU }],
            labels: labels
        });
    } else {
        const el = document.querySelector("#chart-correlation");
        if(el) {
            correlationChart = new ApexCharts(el, optionsCorrelation);
            correlationChart.render();
        }
    }

    // --- GRÁFICO 3: Distribuição ---
    let baixo = 0, medio = 0, alto = 0, pico = 0;
    dataThroughput.forEach(valor => {
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