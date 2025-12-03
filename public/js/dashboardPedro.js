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

        // --- LÓGICA DE CORTE (SPLIT) ---
        // O backend envia o dobro do período (48h, 14d, 60d).
        // Dividimos o array ao meio.
        
        const totalRegistros = todosDados.length;
        const tamanhoJanela = Math.floor(totalRegistros / 2);

        // Dados Atuais: Os últimos 'tamanhoJanela' registros
        const dadosAtuais = todosDados.slice(-tamanhoJanela);

        // Dados Anteriores: Os registros imediatamente antes dos atuais
        const dadosAnteriores = todosDados.slice(-tamanhoJanela * 2, -tamanhoJanela);

        console.log(`=== Período: ${periodo} ===`);
        console.log(`Total: ${totalRegistros} | Janela: ${tamanhoJanela}`);
        console.log(`Atuais: ${dadosAtuais.length} | Anteriores: ${dadosAnteriores.length}`);

        // Renderiza KPIs (em GB)
        renderizarKPIsCalculados(dadosAtuais, dadosAnteriores);
        
        // Renderiza Gráficos (em MB)
        renderizarGraficos(dadosAtuais, periodo);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

function renderizarKPIsCalculados(dadosAtuais, dadosAnteriores) {
    // Soma Rede_Env (que já vem em MB) e converte para GB
    const somarRedeMB = (lista) => lista.reduce((acc, item) => acc + Number(item.Rede_Env || 0), 0);

    const totalAtualMB = somarRedeMB(dadosAtuais);
    const totalAnteriorMB = somarRedeMB(dadosAnteriores);
    
    // Conversão para GB (divide por 1024)
    const totalAtualGB = totalAtualMB / 1024;
    const totalAnteriorGB = totalAnteriorMB / 1024;

    console.log(`KPI - Atual: ${totalAtualMB.toFixed(2)} MB (${totalAtualGB.toFixed(2)} GB)`);
    console.log(`KPI - Anterior: ${totalAnteriorMB.toFixed(2)} MB (${totalAnteriorGB.toFixed(2)} GB)`);

    // KPI Principal: Exibe em GB
    const elTotal = document.getElementById('kpiTotalTransferido');
    if (elTotal) elTotal.innerText = totalAtualGB.toFixed(2) + " GB";

    // Cálculo da Variação (Atual vs Anterior)
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
    if (elSub1) elSub1.innerHTML = `<span class="${cor} font-bold">${icone} ${textoDiferencaGB}</span> vs período anterior`;

    // KPI 2 (Card de Variação)
    const kpi2Valor = document.getElementById('kpiValorVariacao');
    const kpi2Sub = document.getElementById('kpiPercentualVariacao');
    
    if (kpi2Valor) {
        kpi2Valor.innerText = textoDiferencaGB;
        kpi2Valor.className = `text-3xl font-bold mt-1 ${cor}`;
    }
    if (kpi2Sub) {
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
    const labels = lista.map((_, index) => {
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

    // Dados do gráfico em MB (Rede_Env já vem em MB)
    const dataThroughputMB = lista.map(item => Number(item.Rede_Env || 0));
    const dataCPU = lista.map(item => Number(item.CPU || 0)); 

    // --- GRÁFICO 1: Throughput (em MB) ---
    const optionsThroughput = {
        series: [{ name: 'Transferência (MB)', data: dataThroughputMB }],
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
            series: [{ data: dataThroughputMB }],
            xaxis: { categories: labels }
        });
    } else {
        const el = document.querySelector("#chart-throughput");
        if (el) {
            throughputChart = new ApexCharts(el, optionsThroughput);
            throughputChart.render();
        }
    }

    // --- GRÁFICO 2: Correlação (MB vs CPU) ---
    const optionsCorrelation = {
        series: [
            { name: 'Transferência (MB)', type: 'column', data: dataThroughputMB }, 
            { name: 'Uso CPU (%)', type: 'line', data: dataCPU }
        ],
        chart: { height: 350, type: 'line', toolbar: { show: false } },
        stroke: { width: [0, 3] },
        dataLabels: { enabled: false },
        labels: labels,
        yaxis: [
            { title: { text: 'Transferência (MB)' } }, 
            { opposite: true, title: { text: 'CPU (%)' }, max: 100 }
        ],
        colors: ['#2563EB', '#DC3545'],
        tooltip: {
            y: [
                { formatter: (val) => val.toFixed(2) + " MB" },
                { formatter: (val) => val.toFixed(1) + "%" }
            ]
        }
    };

    if (correlationChart) {
        correlationChart.updateOptions({
            series: [{ data: dataThroughputMB }, { data: dataCPU }],
            labels: labels
        });
    } else {
        const el = document.querySelector("#chart-correlation");
        if (el) {
            correlationChart = new ApexCharts(el, optionsCorrelation);
            correlationChart.render();
        }
    }

    // --- GRÁFICO 3: Distribuição de Volume (em MB) ---
    // Categorias ajustadas para valores reais do dataset
    let baixo = 0, medio = 0, alto = 0, pico = 0;
    dataThroughputMB.forEach(valor => {
        if (valor < 50) baixo++;
        else if (valor < 100) medio++;
        else if (valor < 150) alto++;
        else pico++;
    });

    const optionsDist = {
        series: [{ name: 'Ocorrências', data: [baixo, medio, alto, pico] }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
        xaxis: { categories: ['Baixo (<50 MB)', 'Médio (50-100 MB)', 'Alto (100-150 MB)', 'Pico (>150 MB)'] },
        colors: ['#2563EB'],
        tooltip: { y: { formatter: (val) => val + " ocorrências" } }
    };

    if (distribuicaoChart) {
        distribuicaoChart.updateOptions({ series: [{ data: [baixo, medio, alto, pico] }] });
    } else {
        const el = document.querySelector("#chart-distribuicao");
        if (el) {
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