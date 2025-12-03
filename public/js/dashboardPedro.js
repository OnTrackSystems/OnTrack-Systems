// Variáveis globais para os gráficos
var throughputChart;
var correlationChart;
var distribuicaoChart;

const API_BASE_URL = "http://localhost:3333"; 
const idGaragem = sessionStorage.ID_GARAGEM || "18897";

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, iniciando dashboard...");
    atualizarPeriodo('24h');
});

async function atualizarPeriodo(periodo) {
    atualizarBotoesAtivos(periodo);

    // Mostra loading nos alertas
    const containerAlertas = document.getElementById('alertas-container');
    if (containerAlertas) {
        containerAlertas.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span class="ml-2 text-slate-500">Carregando alertas...</span>
            </div>
        `;
    }

    try {
        const url = `${API_BASE_URL}/dashTransferenciaDados/getJsonDashDados/${idGaragem}?periodo=${periodo}`;
        console.log("Buscando dados:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const dados = await response.json();
        console.log("Dados recebidos:", dados);
        
        const todosDados = dados.timeseries || [];
        const alertas = dados.alertas || [];

        console.log(`Alertas no JSON: ${alertas.length}`, alertas);

        // --- LÓGICA DE CORTE (SPLIT) ---
        const totalRegistros = todosDados.length;
        const tamanhoJanela = Math.floor(totalRegistros / 2);

        const dadosAtuais = todosDados.slice(-tamanhoJanela);
        const dadosAnteriores = todosDados.slice(-tamanhoJanela * 2, -tamanhoJanela);

        console.log(`=== Período: ${periodo} ===`);
        console.log(`Total: ${totalRegistros} | Janela: ${tamanhoJanela}`);
        console.log(`Atuais: ${dadosAtuais.length} | Anteriores: ${dadosAnteriores.length}`);

        // Renderiza KPIs (em GB)
        renderizarKPIsCalculados(dadosAtuais, dadosAnteriores);
        
        // Renderiza Gráficos (em MB)
        renderizarGraficos(dadosAtuais, periodo);

        // Renderiza Alertas - SEMPRE chamar, mesmo se vazio
        renderizarAlertas(alertas);

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        
        // Mostra erro nos alertas
        if (containerAlertas) {
            containerAlertas.innerHTML = `
                <div class="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                        <span class="material-symbols-outlined">error</span>
                    </div>
                    <div>
                        <p class="font-medium text-red-800 dark:text-red-200">Erro ao carregar</p>
                        <p class="text-sm text-red-600 dark:text-red-400">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
}

function renderizarAlertas(alertas) {
    console.log("Iniciando renderização de alertas...", alertas);
    
    const container = document.getElementById('alertas-container');
    
    if (!container) {
        console.error("ERRO CRÍTICO: Elemento <div id='alertas-container'> não encontrado no DOM.");
        return;
    }

    // Limpa o conteúdo atual (remove o spinner de loading)
    container.innerHTML = '';

    // Verifica se a lista é nula ou vazia
    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="flex items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <span class="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                    <p class="font-medium text-green-800 dark:text-green-200">Sistema Estável</p>
                    <p class="text-sm text-green-600 dark:text-green-400">Nenhum alerta crítico no período.</p>
                </div>
            </div>
        `;
        return;
    }

    // Pega os últimos 10 alertas e inverte para mostrar o mais recente no topo
    const alertasExibir = alertas.slice(-10).reverse();

    alertasExibir.forEach(alerta => {
        // Define cores baseadas no tipo
        let cores = {
            container: 'border-slate-200 bg-slate-50',
            icone: 'bg-slate-200 text-slate-600',
            titulo: 'text-slate-900',
            texto: 'text-slate-600'
        };

        if (alerta.tipo === 'danger') {
            cores.container = 'border-red-200 bg-red-50';
            cores.icone = 'bg-red-100 text-red-600';
            cores.titulo = 'text-red-900';
            cores.texto = 'text-red-700';
        } else if (alerta.tipo === 'warning') {
            cores.container = 'border-yellow-200 bg-yellow-50';
            cores.icone = 'bg-yellow-100 text-yellow-600';
            cores.titulo = 'text-yellow-900';
            cores.texto = 'text-yellow-700';
        } else if (alerta.tipo === 'success') {
            cores.container = 'border-green-200 bg-green-50';
            cores.icone = 'bg-green-100 text-green-600';
            cores.titulo = 'text-green-900';
            cores.texto = 'text-green-700';
        }

        // Se o JSON já trouxer classes, usa elas (prioridade)
        if (alerta.classes) {
            if (alerta.classes.container) cores.container = alerta.classes.container;
            if (alerta.classes.iconeBg) cores.icone = alerta.classes.iconeBg;
        }

        const html = `
            <div class="flex items-start gap-3 p-3 rounded-lg border ${cores.container} mb-3 transition-all hover:shadow-sm">
                <div class="flex items-center justify-center w-8 h-8 rounded-full ${cores.icone} flex-shrink-0 mt-1">
                    <span class="material-symbols-outlined text-lg">${alerta.icone || 'info'}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm ${cores.titulo}">${alerta.titulo || 'Aviso'}</p>
                    <p class="text-sm ${cores.texto} leading-tight">${alerta.mensagem || ''}</p>
                    <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[10px]">schedule</span>
                        ${formatarTimestamp(alerta.timestamp)}
                    </p>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);
    });

    // Atualiza o contador (bolinha vermelha)
    const contador = document.getElementById('contador-alertas');
    if (contador) {
        const qtdProblemas = alertas.filter(a => a.tipo === 'danger' || a.tipo === 'warning').length;
        contador.innerText = qtdProblemas;
        if (qtdProblemas > 0) {
            contador.classList.remove('hidden');
            contador.classList.add('flex');
        } else {
            contador.classList.add('hidden');
            contador.classList.remove('flex');
        }
    }
    
    console.log("Alertas renderizados com sucesso!");
}

function formatarTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
        // Tenta diferentes formatos
        let dt;
        if (timestamp.includes('T')) {
            dt = new Date(timestamp);
        } else {
            dt = new Date(timestamp.replace(' ', 'T'));
        }
        
        if (isNaN(dt.getTime())) {
            return timestamp;
        }
        
        return dt.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.warn("Erro ao formatar timestamp:", e);
        return timestamp;
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
            const horasParaVoltar = (24 / totalPontos) * iInvertido;
            dataPonto.setMinutes(hoje.getMinutes() - (horasParaVoltar * 60));
            return dataPonto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (periodo === '7d') {
            const diasParaVoltar = (7 / totalPontos) * iInvertido;
            dataPonto.setHours(hoje.getHours() - (diasParaVoltar * 24));
            return dataPonto.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
            const diasParaVoltar = (30 / totalPontos) * iInvertido;
            dataPonto.setHours(hoje.getHours() - (diasParaVoltar * 24));
            return dataPonto.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    });

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
    let categorias = [];
    let contagens = [0, 0, 0, 0];

    if (periodo === '24h') {
        categorias = ['Baixo (<25 MB)', 'Médio (25-32 MB)', 'Alto (32-38 MB)', 'Pico (>38 MB)'];
        dataThroughputMB.forEach(valor => {
            if (valor < 25) contagens[0]++;
            else if (valor < 32) contagens[1]++;
            else if (valor < 38) contagens[2]++;
            else contagens[3]++;
        });
    } else if (periodo === '7d') {
        categorias = ['Baixo (<100 MB)', 'Médio (100-140 MB)', 'Alto (140-170 MB)', 'Pico (>170 MB)'];
        dataThroughputMB.forEach(valor => {
            if (valor < 100) contagens[0]++;
            else if (valor < 140) contagens[1]++;
            else if (valor < 170) contagens[2]++;
            else contagens[3]++;
        });
    } else {
        categorias = ['Baixo (<600 MB)', 'Médio (600-700 MB)', 'Alto (700-780 MB)', 'Pico (>780 MB)'];
        dataThroughputMB.forEach(valor => {
            if (valor < 600) contagens[0]++;
            else if (valor < 700) contagens[1]++;
            else if (valor < 780) contagens[2]++;
            else contagens[3]++;
        });
    }

    const optionsDist = {
        series: [{ name: 'Ocorrências', data: contagens }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
        xaxis: { categories: categorias },
        colors: ['#2563EB'],
        tooltip: { y: { formatter: (val) => val + " ocorrências" } }
    };

    if (distribuicaoChart) {
        distribuicaoChart.updateOptions({ 
            series: [{ data: contagens }],
            xaxis: { categories: categorias }
        });
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