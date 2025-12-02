document.addEventListener('DOMContentLoaded', function() {

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
640000512,Terminal Pirituba,-23.486848,-46.726591`;

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
    const filtroDataset = document.getElementById('filtro-dataset');
    const filtroGaragem = document.getElementById('filtro-garagem');
    const filtroSeveridade = document.getElementById('filtro-severidade');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const btnLimpar = document.getElementById('btn-limpar');
    const msgSemResultados = document.getElementById('msg-sem-resultados');

    // Mapeamento Nome -> ID
    const mapaGaragemNomeId = {};
    paradasData.forEach(parada => {
        const option = document.createElement('option');
        option.value = parada.stop_id;
        option.textContent = parada.stop_name;
        filtroGaragem.appendChild(option);
        mapaGaragemNomeId[parada.stop_name] = parada.stop_id;
    });

 
    
    function parseDataBR(dataStr) {
        // formatando data para BR
        if (!dataStr) return null;
        try {
            const [dataPart, horaPart] = dataStr.split(' ');
            const [dia, mes, ano] = dataPart.split('/');
            const [hora, min, seg] = horaPart.split(':');
            return new Date(ano, mes - 1, dia, hora, min, seg);
        } catch (e) {
            console.error("Erro ao converter data:", dataStr, e);
            return null;
        }
    }

    // Calculando incio e fim da semana
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 (domingo) a 6 (sasbado)
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0); // domingo 00:00

    const fimSemana = new Date(hoje);
    fimSemana.setDate(hoje.getDate() + (6 - diaSemana));
    fimSemana.setHours(23, 59, 59, 999); // sabado 23:59



    
    // cache q armazena os 2 json
    const dadosCache = {
        geral: null,
        abertos: null
    };

    // ve qual é o json para renderizar as coisas
    function renderizarTabelaEGrafico(jsonData) {
        if (!jsonData || !jsonData.dados) {
            console.error("Dados inválidos fornecidos para renderização");
            return;
        }

        if (jsonData.metadata && jsonData.metadata.ultima_atualizacao) {
            document.getElementById("ultimaAtt").innerHTML = jsonData.metadata.ultima_atualizacao;
        }

        const tableBody = document.getElementById("tabelaFiller");
        tableBody.innerHTML = ""; // limpa a tabela

        // Variáveis para o gráfico (semana atual)
        let atuais = { cpu: 0, ram: 0, disco: 0 };

        //MTTR (filtra os resolvidos)
        let mttrTotalHoras = 0;
        let mttrContagemResolvidos = 0;
        

        // mttr
        jsonData.dados.forEach(element => {
            // Se tempoResolucaoHoras > 0 == resolvido
            if (element.tempoResolucaoHoras > 0) {
                mttrTotalHoras += element.tempoResolucaoHoras;
                mttrContagemResolvidos++;
            }

            // cores
            let cor = "green";
            let severidadeTexto = "Info";
            let filtroSeveridadeKey = "info"; 

            if (element.prioridade === "Highest" || element.prioridade === "High") {
                cor = "red";
                severidadeTexto = "Crítico";
                filtroSeveridadeKey = "critico";
            } else if (element.prioridade === "Medium") {
                cor = "yellow";
                severidadeTexto = "Atenção";
                filtroSeveridadeKey = "atencao";
            }

            let local = element; 
            
            // tratando o texto
            // trata o titulo dando replace aonde tem [] globalmente
            let msgLimpa = element.titulo.replace(/\[.*?\]/g, "").replace("-", "").trim();

            // extracao da Garagem
            if (msgLimpa.includes("Garagem")) {
                const partes = msgLimpa.split("Garagem");
                msgLimpa = partes[0].trim();
                
            
                local = partes[1].replace(":", "").trim();
            } else {
                
                local = "Geral";
            }

            // categorias e id
            let filtroGaragemID = "0";
            if (mapaGaragemNomeId[local]) {
                filtroGaragemID = mapaGaragemNomeId[local];
            }

            let categoria = "Outros";
            let filtroCategoriaKey = "outros";
            let ehCpu = false, ehRam = false, ehDisco = false;

            if (element.titulo.includes("CPU")) {
                categoria = "CPU"; filtroCategoriaKey = "cpu"; ehCpu = true;
            } else if (element.titulo.includes("RAM")) {
                categoria = "RAM"; filtroCategoriaKey = "ram"; ehRam = true;
            } else if (element.titulo.includes("Disco")) {
                categoria = "Disco"; filtroCategoriaKey = "disco"; ehDisco = true;
            }

            // contar para o grafico de semana atual
            const dataIncidente = parseDataBR(element.dataHoraCriacao); 
            
            if (dataIncidente && dataIncidente >= inicioSemana && dataIncidente <= fimSemana) {
                if (ehCpu) atuais.cpu++;
                else if (ehRam) atuais.ram++;
                else if (ehDisco) atuais.disco++;
            }

            // ternario pra aberto ou resolvido
            const statusLabel = element.tempoResolucaoHoras === 0 ? "Aberto" : "Resolvido";
            const statusClass = element.tempoResolucaoHoras === 0 ? "status-text-red" : "status-text-green";

            // gerando cada linha da table de incidentes
            const linhaHTML = `
            <tr data-severidade="${filtroSeveridadeKey}" data-categoria="${filtroCategoriaKey}" data-garagem="${filtroGaragemID}">
                <td>#${element.id}</td>
                <td><span class="${statusClass}" style="font-weight:bold;">${statusLabel}</span></td>
                <td><span class="status-badge status-${cor}">${severidadeTexto}</span></td>
                <td>${local}</td>
                <td>${categoria}</td>
                <td>${msgLimpa}</td>
                <td>${element.dataHoraCriacao}</td>
                <td><button class="btn-detalhes">Detalhes</button></td>
            </tr>`;

            tableBody.innerHTML += linhaHTML;
        });

        // calculando o mttr de fato
        const elementoMTTR = document.getElementById("valorMTTR");
        if (elementoMTTR) {
            if (mttrContagemResolvidos > 0) {
                const mediaHoras = mttrTotalHoras / mttrContagemResolvidos;
                
                // converte hora decimal pra hora com min
                const horasInteiras = Math.floor(mediaHoras);
                const minutos = Math.round((mediaHoras - horasInteiras) * 60);
                
                elementoMTTR.innerHTML = `${horasInteiras}h ${minutos}m`;
            } else {
                elementoMTTR.innerHTML = "--";
            }
        }

        // --- CÁLCULO MÉDIA SEMANAL (TOTAL) ---
        // Aqui somamos os contadores da semana atual (calculados no loop acima)
        // e atualizamos o elemento no DOM.
        const elementoMediaSemanal = document.getElementById("mediaSemanal");
        if(elementoMediaSemanal) {
            const totalSemanal = atuais.cpu + atuais.ram + atuais.disco;
            elementoMediaSemanal.innerHTML = totalSemanal;
        }

        // chamando a funcao pra renderizar aplicando os filtros
        renderizarGrafico(atuais);
        aplicarFiltros();
    }

    // atualizando a tabela para mostrar os chamados que estao abertos
    function atualizarPaineisFixos(jsonDataAbertos) {
        if (!jsonDataAbertos || !jsonDataAbertos.dados) return;

        let contadorCritico = 0;
        let contadorMedio = 0;
        let countCat = { cpu: 0, ram: 0, disco: 0 };

        jsonDataAbertos.dados.forEach(element => {
            
            if (element.prioridade === "Highest" || element.prioridade === "High") {
                contadorCritico++;
            } else if (element.prioridade === "Medium") {
                contadorMedio++;
            }

            // Categorias
            if (element.titulo.includes("CPU")) countCat.cpu++;
            else if (element.titulo.includes("RAM")) countCat.ram++;
            else if (element.titulo.includes("Disco")) countCat.disco++;
        });

        // atualiza bolinha contador
        if(document.getElementById("bolaCrit")) document.getElementById("bolaCrit").innerHTML = contadorCritico;
        if(document.getElementById("bolaMed")) document.getElementById("bolaMed").innerHTML = contadorMedio;
        if(document.getElementById("indicadorCritico")) document.getElementById("indicadorCritico").innerHTML = contadorCritico;

        // atualiza as barras
        const totalAbertos = jsonDataAbertos.dados.length || 1;
        const updateCatUI = (type, count) => {

            // calc porcentagem
            const pct = Math.round((count / totalAbertos) * 100);
            if(document.getElementById(`qtd${type}`)) document.getElementById(`qtd${type}`).innerText = count;
            if(document.getElementById(`pct${type}`)) document.getElementById(`pct${type}`).innerText = pct + "%";
            if(document.getElementById(`bar${type}`)) document.getElementById(`bar${type}`).style.width = pct + "%";
        };

        updateCatUI('Cpu', countCat.cpu);
        updateCatUI('Ram', countCat.ram);
        updateCatUI('Disco', countCat.disco);
    }

    // fetch dos dados gerais
    fetch("/chamados/getCallsFromBucket/").then(res => res.json()).then(data => {
        dadosCache.geral = data;
       
        if(filtroDataset.value === 'geral') {
            renderizarTabelaEGrafico(dadosCache.geral);
        }
    }).catch(err => console.error("Erro fetch Geral:", err));

    // fetch apenas dos chamados abertos
    fetch("/chamados/getCallsFromBucketOpen/").then(res => res.json()).then(data => {
        dadosCache.abertos = data;
        
        // Chamada corrigida aqui (usando o nome correto da função definida acima)
        atualizarPaineisFixos(data);

        // vendo se o filtro for "aberto" se for renderiza com os dados dos chamados abertos
        if(filtroDataset.value === 'abertos') {
            renderizarTabelaEGrafico(dadosCache.abertos);
        }
    }).catch(err => console.error("Erro fetch Abertos:", err));


    // listener da tabela
    filtroDataset.addEventListener('change', function() {
        const tipo = this.value; 
        if(dadosCache[tipo]) {
            console.log("Trocando visualização para:", tipo);
            renderizarTabelaEGrafico(dadosCache[tipo]);
        } else {
            console.log("Aguardando carregamento dos dados de:", tipo);
            
            document.getElementById("tabelaFiller").innerHTML = "<tr><td colspan='7'>Carregando dados...</td></tr>";
        }
    });


   // todos os filtros
    function aplicarFiltros() {
        const severidade = filtroSeveridade.value;
        const categoria = filtroCategoria.value;
        const garagemId = filtroGaragem.value;
        
        const tabelaAlertas = document.getElementById('tabela-alertas');
        const linhasTabela = tabelaAlertas.querySelectorAll('tbody tr');
        
        let resultadosEncontrados = 0;

        linhasTabela.forEach(linha => {
            const linhaSev = linha.getAttribute('data-severidade');
            const linhaCat = linha.getAttribute('data-categoria');
            const linhaGar = linha.getAttribute('data-garagem');

            const filtroSevOK = severidade === 'todos' || linhaSev === severidade;
            const filtroCatOK = categoria === 'todos' || linhaCat === categoria;
            const filtroGarOK = garagemId === 'todos' || linhaGar === garagemId;

            if (filtroSevOK && filtroCatOK && filtroGarOK) {
                linha.style.display = '';
                resultadosEncontrados++;
            } else {
                linha.style.display = 'none';
            }
        });

        if (resultadosEncontrados === 0 && msgSemResultados) {
            msgSemResultados.style.display = 'block';
        } else if (msgSemResultados) {
            msgSemResultados.style.display = 'none';
        }
    }

    filtroSeveridade.addEventListener('change', aplicarFiltros);
    filtroCategoria.addEventListener('change', aplicarFiltros);
    filtroGaragem.addEventListener('change', aplicarFiltros);
    
    if(btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            filtroSeveridade.value = 'todos';
            filtroCategoria.value = 'todos';
            filtroGaragem.value = 'todos';
            aplicarFiltros();
        });
    }

    // modal pra exibir os detalhes de cada chamado
    const modalOverlay = document.getElementById('modal-overlay');
    const fecharBotoes = document.querySelectorAll('.fechar-modal, .fechar-modal-btn');
    const modalBody = document.querySelector('.modal-body'); 

    // def pra fechar
    function fecharModal() { modalOverlay.style.display = 'none'; }
    fecharBotoes.forEach(btn => btn.addEventListener('click', fecharModal));

    // quando clicar em detalhes faz essa funcao
    document.getElementById('tabelaFiller').addEventListener('click', function(e) {
        
        // verifica se o  clique tem a classe do botão
        if(e.target && e.target.classList.contains('btn-detalhes')) {
            
            // ve qual é a linha mais proxima que foi clicada
            const row = e.target.closest('tr');
            
            // pgando o id do chamado, que fica na 1 coluna
            const idVisual = row.querySelector('td:first-child').textContent;
            
            // limpando a id
            const idPuro = idVisual.replace("#", "");

            // buscando as info no cache
            // vendo o tipo do json se é aberto ou geral
            const tipoAtual = filtroDataset.value; 
            // pegando os dados e definindo o tipo
            const listaDados = dadosCache[tipoAtual].dados;

            // procurando os dados do chamado pelo id puro (sem a #)
            const chamadoEncontrado = listaDados.find(item => item.id === idPuro);

            if (chamadoEncontrado) {
                // pega os dados do chamados
                const descricao = chamadoEncontrado.descricao || "Sem descrição disponível.";
                const dtCriacao = chamadoEncontrado.dataHoraCriacao || "N/A";
                const dtResolucao = chamadoEncontrado.dataHoraResolucao || "Em aberto";

                // faz o html conforme as info coletadas
                modalBody.innerHTML = `
                    <p class="modal-meta"><strong>ID do Evento:</strong> <span>${idVisual}</span></p>
                    <div style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 0.9rem; color: #555;">
                        <div><strong>Abertura:</strong> ${dtCriacao}</div>
                        <div><strong>Resolução:</strong> ${dtResolucao}</div>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                    <p style="white-space: pre-wrap;">${descricao}</p>
                    <br>
                `;

                // exibe o modal
                modalOverlay.style.display = 'flex';
            } else {
                alert("Erro: Detalhes não encontrados na memória.");
            }
        }
    });



    // apex
    function renderizarGrafico(atuais) {

        function simularPassado(valorAtual) {
    if (valorAtual === 0) return Math.floor(Math.random() * 4) + 2;

    return Math.floor(valorAtual * (1.2 + Math.random() * 0.5));
}

        let anteriores = {
            cpu: simularPassado(atuais.cpu),
            ram: simularPassado(atuais.ram),
            disco: simularPassado(atuais.disco)
        };

        var options = {
            series: [{
                name: 'Semana Atual',
                data: [atuais.cpu, atuais.ram, atuais.disco]
            }, {
                name: 'Semana Anterior',
                data: [anteriores.cpu, anteriores.ram, anteriores.disco]
            }],
            chart: {
                type: 'bar',
                height: 250,
                toolbar: { show: false },
                fontFamily: 'Arial, sans-serif'
            },
            colors: ['#dc3545', '#ffc107'],
            plotOptions: {
                bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 }
            },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: ['CPU', 'RAM', 'Disco'] },
            yaxis: { title: { text: 'Alertas' } }
        };

        if(document.querySelector("#grafico-comparativo")) {
            document.querySelector("#grafico-comparativo").innerHTML = "";
            var chart = new ApexCharts(document.querySelector("#grafico-comparativo"), options);
            chart.render();
        }
    }
});