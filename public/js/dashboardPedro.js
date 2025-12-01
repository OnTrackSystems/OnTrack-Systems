// Variáveis globais para os gráficos
var throughputChart;
var correlationChart;
var distribuicaoChart;

// Define a garagem (busca da sessão ou usa valor padrão)
const idGaragem = sessionStorage.ID_GARAGEM || "18897";

document.addEventListener("DOMContentLoaded", () => {
    atualizarPeriodo('24h');
});

async function atualizarPeriodo(periodo) {
    atualizarBotoesAtivos(periodo);

    try {
        const response = await fetch(`/dashDados/getJsonDashDados/${idGaragem}?periodo=${periodo}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dados = await response.json();
        
        console.log(`Dados recebidos (${periodo}):`, dados);

        renderizarKPIs(dados);
        renderizarGraficos(dados, periodo);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

function renderizarKPIs(dados) {
    const kpis = dados.kpis_resumo;

    // 1. Volume Total: O JSON vem em MB convertemos para GB
    const totalGB = (kpis.mb_total_enviado_periodo / 1024);
    document.getElementById('kpiTotalTransferido').innerText = totalGB.toFixed(2) + " GB";

    // 2. Variação: O JSON atual NÃO possui campo de variação percentual.
    // Deixaremos estático ou oculto para não quebrar a tela.
    document.getElementById('kpiValorVariacao').innerText = "-";
    document.getElementById('kpiPercentualVariacao').innerText = "Dado não disponível no JSON";
    
    // 3. Alertas: Usaremos 'onibus_garagem_pico' como métrica de exemplo 
    // ou deixamos estático se não houver campo de "alertas"
    // Aqui estou simulando: se CPU > 80% na média, é crítico.
    const alertas = kpis.cpu_uso_medio > 80 ? "ALTO" : "Normal";
    document.getElementById('kpiAlertasCriticos').innerText = kpis.onibus_garagem_pico + " (Pico Ônibus)";
}

function renderizarGraficos(dados, periodo) {
    const lista = dados.timeseries;

    // Se a lista estiver vazia, não faz nada
    if (!lista || lista.length === 0) return;

    // --- Mapeamento dos Dados (Array Map) ---
    // Extraímos os arrays simples para o ApexCharts usar
    
    // 1. Formatar Labels (Eixo X)
    const labels = lista.map(item => {
        const dataObj = new Date(item.timestamp);
        
        // Se for 24h, mostra Hora:Minuto. Se for dias, mostra Dia/Mês
        if (periodo === '24h') {
            return dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    });

    // 2. Dados numéricos
    const dataThroughput = lista.map(item => item.Rede_Env); // Assumindo MB
    const dataCPU = lista.map(item => item.CPU);

    // --- GRÁFICO 1: Histórico de Throughput ---
    const optionsThroughput = {
        series: [{
            name: 'Envio (MB)',
            data: dataThroughput
        }],
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: labels },
        yaxis: {
            title: { text: 'Megabytes (MB)' }
        },
        colors: ['#135bec'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        tooltip: {
            y: { formatter: (val) => val.toFixed(2) + " MB" }
        }
    };

    if (throughputChart) {
        throughputChart.updateOptions(optionsThroughput);
    } else {
        throughputChart = new ApexCharts(document.querySelector("#chart-throughput"), optionsThroughput);
        throughputChart.render();
    }

    // --- GRÁFICO 2: Correlação (Throughput vs CPU) ---
    const optionsCorrelation = {
        series: [{
            name: 'Rede (MB)',
            type: 'column',
            data: dataThroughput
        }, {
            name: 'Uso CPU (%)',
            type: 'line',
            data: dataCPU
        }],
        chart: {
            height: 350,
            type: 'line',
            toolbar: { show: false }
        },
        stroke: { width: [0, 3] }, // Coluna sem borda, Linha com espessura 3
        dataLabels: { enabled: false },
        labels: labels, // Eixo X
        yaxis: [{
            title: { text: 'Rede (MB)' },
        }, {
            opposite: true,
            title: { text: 'CPU (%)' },
            max: 100 // Teto do eixo CPU
        }],
        colors: ['#135bec', '#DC3545'], // Azul para rede, Vermelho para CPU
    };

    if (correlationChart) {
        correlationChart.updateOptions(optionsCorrelation);
    } else {
        correlationChart = new ApexCharts(document.querySelector("#chart-correlation"), optionsCorrelation);
        correlationChart.render();
    }

    // --- GRÁFICO 3: Distribuição (Histograma Simulado) ---
    // Vamos criar faixas baseadas nos valores de Rede_Env
    
    let baixo = 0, medio = 0, alto = 0, pico = 0;
    
    // Regra de negócio simples para classificar o tráfego
    dataThroughput.forEach(valor => {
        if (valor < 10) baixo++;
        else if (valor < 20) medio++;
        else if (valor < 30) alto++;
        else pico++;
    });

    const optionsDist = {
        series: [{
            name: 'Ocorrências',
            data: [baixo, medio, alto, pico]
        }],
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: { borderRadius: 4, horizontal: false }
        },
        xaxis: {
            categories: ['Baixo (<10MB)', 'Médio (10-20MB)', 'Alto (20-30MB)', 'Pico (>30MB)'],
        },
        colors: ['#28A745'] // Verde
    };

    if (distribuicaoChart) {
        distribuicaoChart.updateOptions(optionsDist);
    } else {
        distribuicaoChart = new ApexCharts(document.querySelector("#chart-distribuicao"), optionsDist);
        distribuicaoChart.render();
    }
}

// Funções visuais (Botões)
function atualizarBotoesAtivos(periodo) {
    const botoes = ['btn-kpi-24h', 'btn-kpi-7d', 'btn-kpi-30d', 'btn-24h', 'btn-7d', 'btn-30d'];
    botoes.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-slate-100');
        }
    });
    
    // Ativa os botões correspondentes
    const idsAtivos = [`btn-kpi-${periodo}`, `btn-${periodo}`];
    idsAtivos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('bg-slate-100');
            el.classList.add('bg-primary', 'text-white');
        }
    });
}

function atualizarGrafico(periodo) {
    atualizarPeriodo(periodo);
}