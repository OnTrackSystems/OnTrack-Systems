document.addEventListener("DOMContentLoaded", () => {

    // --- Dados por período (mock) ---
    const dadosPorPeriodo = {
        "24h": {
            timestamps: ["09:00", "09:10", "09:20", "09:30", "09:40", "09:50", "10:00", "10:10", "10:20", "10:30"],
            enviados: [12.4, 18.1, 22.6, 19.8, 25.3, 28.9, 31.2, 29.4, 34.1, 36.7],
            recebidos: [10.2, 14.8, 19.3, 17.1, 22.7, 26.5, 27.9, 26.4, 30.5, 32.9]
        },
        "7d": {
            timestamps: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
            enviados: [85.2, 92.1, 78.6, 95.3, 110.5, 65.2, 72.4],
            recebidos: [78.5, 84.3, 71.2, 88.7, 102.1, 58.9, 65.3]
        },
        "30d": {
            timestamps: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
            enviados: [345.2, 412.1, 398.6, 425.3],
            recebidos: [312.5, 384.3, 371.2, 398.7]
        }
    };

    const kpiMock = {
        "24h": { volume: 420, variacaoAbs: +22, variacaoPercent: +5.2, alertas: 3 },
        "7d": { volume: 2600, variacaoAbs: -110, variacaoPercent: -3.8, alertas: 12 },
        "30d": { volume: 10800, variacaoAbs: +1300, variacaoPercent: +12.4, alertas: 43 }
    };

    let chartThroughput = null;
    let chartCorrelation = null;
    let chartDistribuicao = null;
    let periodoAtual = "24h";

    // --- KPIs ---
    function atualizarKPIs(periodo) {
        const k = kpiMock[periodo];
        if (!k) return;
        document.getElementById("kpiTotalTransferido").textContent = `${k.volume} GB`;
        const absElem = document.getElementById("kpiVariacaoTransferido");
        absElem.textContent = (k.variacaoAbs > 0 ? `+${k.variacaoAbs}` : k.variacaoAbs) + " GB";
        absElem.className = "text-sm font-medium mt-1 " + (k.variacaoAbs >= 0 ? "text-green-600" : "text-red-600");
        document.getElementById("kpiValorVariacao").textContent = (k.variacaoAbs > 0 ? `+${k.variacaoAbs}` : k.variacaoAbs) + " GB";
        const pctElem = document.getElementById("kpiPercentualVariacao");
        pctElem.textContent = (k.variacaoPercent > 0 ? `+${k.variacaoPercent}%` : `${k.variacaoPercent}%`);
        pctElem.className = "text-sm font-medium mt-1 " + (k.variacaoPercent >= 0 ? "text-green-600" : "text-red-600");
        document.getElementById("kpiAlertasCriticos").textContent = k.alertas;
    }

    // --- Throughput (line) ---
    function criarGraficoThroughput(periodo) {
        const dados = dadosPorPeriodo[periodo];
        if (!dados) return;

        const optionsThroughput = {
            chart: { 
                type: 'line', 
                height: 300, 
                toolbar: { show: true },
                margins: { bottom: 60 }
            },
            series: [
                { name: "MB Total Enviados", data: dados.enviados },
                { name: "MB Total Recebidos", data: dados.recebidos }
            ],
            xaxis: { 
                categories: dados.timestamps, 
                labels: { 
                    rotate: -45,
                    offsetY: 5,
                    style: { colors: '#64748b', fontSize: '11px' }
                },
                axisBorder: { show: true },
                axisTicks: { show: true }
            },
            stroke: { curve: 'smooth', width: 3 },
            legend: { show: true, position: 'bottom', horizontalAlign: 'center', offsetY: 10 },
            tooltip: { shared: true, intersect: false },
            fontFamily: 'Inter, sans-serif',
            grid: { padding: { bottom: 40 } }
        };

        if (chartThroughput) chartThroughput.destroy();
        chartThroughput = new ApexCharts(document.querySelector("#chart-throughput"), optionsThroughput);
        chartThroughput.render();
    }

    // --- Correlação (scatter + line) ---
    function criarGraficoCorrelation() {
        const optionsCorrelation = {
            series: [
                { name: 'Operação Normal', type: 'scatter', data: [[15, 20], [22, 28], [35, 45], [42, 40], [55, 60], [62, 58], [70, 75], [78, 82]] },
                { name: 'Tendência Esperada', type: 'line', data: [[10, 15], [90, 95]] }
            ],
            chart: { 
                height: 300, 
                type: 'line', 
                toolbar: { show: true }, 
                zoom: { enabled: true },
                margins: { bottom: 50 }
            },
            colors: ['#135bec', '#8c8c8c'],
            fill: { type: 'solid', opacity: [1, 0.5] },
            stroke: { width: [0, 3], dashArray: [0, 5] },
            markers: { size: [7, 0] },
            xaxis: { 
                type: 'numeric', 
                min: 0, 
                max: 100, 
                tickAmount: 5, 
                title: { 
                    text: 'Uso de CPU(%)',
                    style: { color: '#64748b', fontSize: '12px' }
                },
                labels: { style: { colors: '#64748b', fontSize: '11px' } }
            },
            yaxis: { 
                min: 0, 
                max: 100, 
                tickAmount: 5, 
                title: { 
                    text: 'Throughput (Mbps)',
                    style: { color: '#64748b', fontSize: '12px' }
                },
                labels: { style: { colors: '#64748b', fontSize: '11px' } }
            },
            legend: { position: 'bottom', markers: { radius: 12 }, offsetY: 10 },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { bottom: 30 } },
            tooltip: {
                shared: false,
                intersect: true,
                y: { formatter: function (val) { return val + " Mbps"; } },
                x: { formatter: function (val) { return val + "% Uso"; } }
            },
            fontFamily: 'Inter, sans-serif'
        };

        if (chartCorrelation) chartCorrelation.destroy();
        chartCorrelation = new ApexCharts(document.querySelector("#chart-correlation"), optionsCorrelation);
        chartCorrelation.render();
    }

    // --- Distribuição (histograma via barras com bins) ---
    function criarGraficoDistribuicao() {
        const throughputMock = Array.from({ length: 200 }, () =>
            parseFloat((Math.random() * 40 + 5).toFixed(2))
        );

        // Sturges
        const n = throughputMock.length;
        const binCount = Math.ceil(Math.log2(n) + 1);
        const min = Math.min(...throughputMock);
        const max = Math.max(...throughputMock);
        const binSize = (max - min) / binCount;

        const bins = Array.from({ length: binCount }, (_, i) => ({
            label: `${(min + i * binSize).toFixed(1)} - ${(min + (i + 1) * binSize).toFixed(1)}`,
            count: 0
        }));

        throughputMock.forEach(v => {
            let idx = Math.floor((v - min) / binSize);
            if (idx === binCount) idx = binCount - 1;
            bins[idx].count++;
        });

        const optionsDistribuicao = {
            chart: { 
                type: "bar", 
                height: 300, 
                toolbar: { show: true },
                margins: { bottom: 60 }
            },
            series: [{ name: "Frequência", data: bins.map(b => b.count) }],
            xaxis: { 
                categories: bins.map(b => b.label), 
                title: { 
                    text: "MB/s",
                    style: { color: '#64748b', fontSize: '12px' }
                }, 
                labels: { 
                    rotate: -45,
                    offsetY: 5,
                    style: { colors: '#64748b', fontSize: '11px' }
                },
                axisBorder: { show: true },
                axisTicks: { show: true }
            },
            yaxis: { 
                title: { 
                    text: "Frequência",
                    style: { color: '#64748b', fontSize: '12px' }
                },
                labels: { style: { colors: '#64748b', fontSize: '11px' } }
            },
            plotOptions: { bar: { borderRadius: 0, columnWidth: "100%" } },
            stroke: { 
                show: true,
                width: 0.8,
                colors: ['#000000']
            },
            colors: ["#135bec"],
            tooltip: { y: { formatter: val => `${val} ocorrências` } },
            fontFamily: 'Inter, sans-serif',
            grid: { padding: { bottom: 40 } }
        };

        if (chartDistribuicao) chartDistribuicao.destroy();
        chartDistribuicao = new ApexCharts(document.querySelector("#chart-distribuicao"), optionsDistribuicao);
        chartDistribuicao.render();
    }

    // --- Atualiza período (botoes usam os mesmos IDs do seu HTML original) ---
    function atualizarGrafico(periodo) {
        periodoAtual = periodo;
        criarGraficoThroughput(periodo);
        atualizarKPIs(periodo);
    }

    // --- Eventos dos botões (mantendo IDs originais) ---
    const btnKPI24 = document.getElementById("btn-kpi-24h");
    const btnKPI7 = document.getElementById("btn-kpi-7d");
    const btnKPI30 = document.getElementById("btn-kpi-30d");

    if (btnKPI24) btnKPI24.addEventListener("click", () => { atualizarGrafico("24h"); btnKPI24.classList.add("bg-primary","text-white"); btnKPI7.classList.remove("bg-primary","text-white"); btnKPI30.classList.remove("bg-primary","text-white"); });
    if (btnKPI7) btnKPI7.addEventListener("click", () => { atualizarGrafico("7d"); btnKPI7.classList.add("bg-primary","text-white"); btnKPI24.classList.remove("bg-primary","text-white"); btnKPI30.classList.remove("bg-primary","text-white"); });
    if (btnKPI30) btnKPI30.addEventListener("click", () => { atualizarGrafico("30d"); btnKPI30.classList.add("bg-primary","text-white"); btnKPI24.classList.remove("bg-primary","text-white"); btnKPI7.classList.remove("bg-primary","text-white"); });

    // botões do gráfico de histórico (mesmos IDs do seu HTML original)
    const btn24 = document.getElementById("btn-24h");
    const btn7 = document.getElementById("btn-7d");
    const btn30 = document.getElementById("btn-30d");

    if (btn24) btn24.addEventListener("click", () => atualizarGrafico("24h"));
    if (btn7) btn7.addEventListener("click", () => atualizarGrafico("7d"));
    if (btn30) btn30.addEventListener("click", () => atualizarGrafico("30d"));

    // --- Inicialização ---
    atualizarGrafico("24h");

    // aplicar destaque inicial nos botões KPI e gráfico
    if (btnKPI24) btnKPI24.classList.add("bg-primary","text-white");
    if (btn24) btn24.classList.add("bg-primary","text-white");

    criarGraficoCorrelation();
    criarGraficoDistribuicao();

});
