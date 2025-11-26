document.addEventListener('DOMContentLoaded', function() {
            
    // Conteúdo do arquivo garagens.csv
    const csvContent = `stop_id,stop_name,stop_lat,stop_lon
18849,Vila Madalena,-23.546498,-46.691141
18852,Jabaquara,-23.646033,-46.641028
18860,Ana Rosa,-23.581203,-46.638489
18861,Paraíso,-23.5754,-46.6407
18867,Anhangabaú,-23.5478,-46.6392
18868,Liberdade,-23.555211,-46.635581
18872,Luz,-23.5366,-46.6343
18879,Santana,-23.502716,-46.624716
18882,Tucuruvi,-23.480049,-46.603209
18884,Penha,-23.533594,-46.542944
18888,Artur Alvim,-23.540068,-46.484833
18895,Guaianases,-23.542298,-46.415633
18897,Itaim Paulista,-23.493989,-46.402304
18901,Calmon Viana,-23.525497,-46.332803
18908,Socorro,-23.66343,-46.71097
18910,Morumbi,-23.621519,-46.701657
18912,Vila Olímpia,-23.593185,-46.692871
18914,Amador Bueno,-23.5307,-46.983928
18921,Perus,-23.404054,-46.754465
18922,Jaraguá,-23.455502,-46.738483
18932,Rio Grande Da Serra,-23.742981,-46.392026
18942,Ipiranga,-23.582356,-46.59666
18944,Tatuapé,-23.5403,-46.5767
18951,Jardim Silveira,-23.523568,-46.893491
18960,Osasco,-23.527834,-46.776007
18962,Ceasa,-23.538372,-46.741543
18965,Pirituba,-23.488464,-46.726058
18966,Pinheiros,-23.566631,-46.703082
18975,Jundiai,-23.195643,-46.8719
18981,Estudantes,-23.515696,-46.18493
18987,Brás,-23.545461,-46.616228
19044,Campo Limpo,-23.648987,-46.758878
19045,Capão Redondo,-23.659955,-46.768691
301729,Terminal Jardim Britânia,-23.432142,-46.787093
1211339,Butantã,-23.571874,-46.708048
1211402,Terminal Morumbi,-23.58572,-46.724003
1707356,Terminal Campo Limpo,-23.630478,-46.773613
2113416,Terminal Casa Verde,-23.496071,-46.662431
2600672,Paulista,-23.555071,-46.662131
3014630,Grajaú,-23.736283,-46.697068
3014807,Terminal Grajaú,-23.736292,-46.696819
3305180,Metrô Alto Do Ipiranga,-23.602369,-46.61171
3305203,Gentil De Moura,-23.602801,-46.613745
3305845,Sacomã,-23.601192,-46.601963
3305881,Terminal Sacomã,-23.602998,-46.602819
3407130,Terminal Água Espraiada,-23.613618,-46.695232
3407190,Campo Belo,-23.618357,-46.682067
3515230,Jardim Romano,-23.485148,-46.386211
3609008,Terminal A. E. Carvalho,-23.517644,-46.475981
3702829,Metrô Conceição,-23.635232,-46.641543
4114459,Vila Aurora,-23.437612,-46.747275
4503923,Terminal João Dias,-23.643855,-46.733968
5306694,Moema,-23.603386,-46.661974
5614760,Terminal Parelheiros,-23.828237,-46.72682
6714568,Pça. Do Correio,-23.542315,-46.635676
6714588,Terminal Bandeira,-23.549173,-46.639109
6714591,Terminal Amaral Gurgel,-23.538547,-46.648454
7612124,São Miguel Paulista,-23.490494,-46.443699
7805208,Vila União,-23.60294,-46.515768
7805213,Jardim Planalto,-23.606046,-46.507963
7805216,Fazenda Da Juta,-23.611853,-46.487579
7805217,São Mateus,-23.612272,-46.477314
7805250,Terminal Sapopemba,-23.614045,-46.500996
8010164,Terminal Mercado,-23.547015,-46.628892
8914861,União De Vila Nova,-23.48373,-46.462619
9206171,Metrô Vila Mariana,-23.589293,-46.63526
9206443,Chácara Klabin,-23.59299,-46.630999
9206548,Hospital São Paulo,-23.598381,-46.645612
9505541,Vila Prudente,-23.584447,-46.581943
9607516,Terminal Vila Sônia,-23.590998,-46.736223
9607525,Vila Sônia,-23.591689,-46.735692
420013595,Terminal Jardim Ângela,-23.690869,-46.774134
450014023,Terminal Guarapiranga,-23.668588,-46.735464
530015503,Parque Ibirapuera,-23.579414,-46.661951
560009238,Terminal Varginha,-23.766793,-46.716431
600012461,Metrô Penha,-23.53293,-46.543309
640000512,Terminal Pirituba,-23.486848,-46.726591
`;

    // 1. Processamento dos dados do CSV
    function parseCSV(csv) {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index].trim();
                });
                data.push(obj);
            }
        }
        return data;
    }

    const paradasData = parseCSV(csvContent);
    const filtroSeveridade = document.getElementById('filtro-severidade');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroGaragem = document.getElementById('filtro-garagem');

    // 2. Popula o <select> do Local (Garagem) com os dados do CSV
    paradasData.forEach(parada => {
        const option = document.createElement('option');
        option.value = parada.stop_id;
        option.textContent = parada.stop_name;
        filtroGaragem.appendChild(option);
    });


    // 3. Inicialização de Filtros (Nativa)
    // O Tom Select foi removido. Os filtros agora usam a funcionalidade nativa.


    // 4. Lógica de Filtragem da Tabela
    const tabelaAlertas = document.getElementById('tabela-alertas');
    const msgSemResultados = document.getElementById('msg-sem-resultados');
    const linhasTabela = tabelaAlertas.querySelectorAll('tbody tr');
    const btnLimpar = document.getElementById('btn-limpar');
    
    function aplicarFiltros() {
        // Obtém valores dos <select> nativos
        const severidade = filtroSeveridade.value;
        const categoria = filtroCategoria.value;
        const garagemId = filtroGaragem.value; 
        
        let resultadosEncontrados = 0;

        linhasTabela.forEach(linha => {
            const linhaSeveridade = linha.getAttribute('data-severidade');
            const linhaCategoria = linha.getAttribute('data-categoria');
            const linhaGaragem = linha.getAttribute('data-garagem');

            const filtroSeveridadeOK = severidade === 'todos' || linhaSeveridade === severidade;
            const filtroCategoriaOK = categoria === 'todos' || linhaCategoria === categoria;
            const filtroGaragemOK = garagemId === 'todos' || linhaGaragem === garagemId;

            if (filtroSeveridadeOK && filtroCategoriaOK && filtroGaragemOK) {
                linha.style.display = '';
                resultadosEncontrados++;
            } else {
                linha.style.display = 'none';
            }
        });

        if (resultadosEncontrados === 0) {
            msgSemResultados.style.display = 'block';
            tabelaAlertas.style.display = 'none';
        } else {
            msgSemResultados.style.display = 'none';
            tabelaAlertas.style.display = 'table';
        }
    }
    
    // Event listeners para aplicar os filtros (agora todos são eventos nativos)
    filtroSeveridade.addEventListener('change', aplicarFiltros); 
    filtroCategoria.addEventListener('change', aplicarFiltros);
    filtroGaragem.addEventListener('change', aplicarFiltros); 
    
    btnLimpar.addEventListener('click', aplicarFiltros); 

    // Aplica filtros ao carregar a página
    aplicarFiltros();


    // 5. Lógica do Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const fecharBotoes = document.querySelectorAll('.fechar-modal, .fechar-modal-btn');
    const btnDetalhes = document.querySelectorAll('.btn-detalhes');
    const modalIdTexto = document.getElementById('modal-id-texto');

    function abrirModal(eventoId) {
        modalIdTexto.textContent = eventoId || '#Não_Informado';
        modalOverlay.style.display = 'flex';
    }

    function fecharModal() {
        modalOverlay.style.display = 'none';
    }

    fecharBotoes.forEach(btn => btn.addEventListener('click', fecharModal));

    btnDetalhes.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const eventId = row.querySelector('td:first-child').textContent;
            abrirModal(eventId);
        });
    });

    // 6. Configuração e Renderização do Gráfico ApexCharts
    var comparativoOptions = {
        series: [{
            name: 'Semana Atual',
            data: [44, 55, 41]
        }, {
            name: 'Semana Anterior',
            data: [13, 23, 20]
        }],
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false },
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: ['CPU', 'RAM', 'Disco'],
        },
        yaxis: {
            title: {
                text: 'Nº de Incidentes'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " incidentes"
                }
            }
        },
        colors: ['#dc3545', '#ffc107'] // Cor Perigo e Cor Atenção
    };

    if (document.querySelector("#grafico-comparativo")) {
        var comparativoChart = new ApexCharts(document.querySelector("#grafico-comparativo"), comparativoOptions);
        comparativoChart.render();
    }
});