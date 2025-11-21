const JIRA_DOMAIN = 'https://ontracksys.atlassian.net';
const USER_EMAIL = process.env.JIRA_EMAIL;
const API_TOKEN = process.env.JIRA_API_TOKEN;

/**
 * Função Auxiliar: Extrai texto simples do formato complexo ADF do Jira
 * O Jira v3 retorna a descrição como blocos de objetos, não como string.
 */
function extrairTextoDoADF(adfBody) {
    if (!adfBody || !adfBody.content) return 'Sem descrição';

    let textoFinal = '';
    
    // Percorre os blocos (parágrafos)
    adfBody.content.forEach(bloco => {
        if (bloco.content) {
            bloco.content.forEach(item => {
                if (item.type === 'text') {
                    textoFinal += item.text + ' ';
                }
            });
            textoFinal += '\n'; // Quebra de linha entre parágrafos
        }
    });

    return textoFinal.trim() || 'Descrição vazia ou formato não texto';
}

async function buscarChamados() {
    try {
        const endpoint = '/rest/api/3/search/jql';
        const jqlQuery = 'project = CHAMADOS ORDER BY created DESC';
        
        // 1. ATUALIZAÇÃO AQUI: Adicionado 'resolutiondate'
        const queryParams = new URLSearchParams({
            jql: jqlQuery,
            fields: 'summary,status,priority,description,created,assignee,resolutiondate'
        });

        const urlCompleta = `${JIRA_DOMAIN}${endpoint}?${queryParams.toString()}`;

        const response = await fetch(urlCompleta, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${USER_EMAIL}:${API_TOKEN}`).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Erro na API do Jira: ${response.status} - ${errorBody}`);
        }

        const json = await response.json();

        const chamadosFormatados = json.issues.map(issue => {
            
            // Formatando datas para Português (Dia/Mês/Ano Hora:Minuto)
            const dataCriacaoObj = new Date(issue.fields.created);
            const dataResolucaoObj = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null;

            return {
                id: issue.key,
                titulo: issue.fields.summary,
                
                // 2. ATUALIZAÇÃO: Usando a função auxiliar para ler a descrição
                descricao: extrairTextoDoADF(issue.fields.description),
                
                status: issue.fields.status ? issue.fields.status.name : 'Sem Status',
                prioridade: issue.fields.priority ? issue.fields.priority.name : 'Normal',
                responsavel: issue.fields.assignee ? issue.fields.assignee.displayName : 'Não atribuído',

                // 3. ATUALIZAÇÃO: Retornando Datas e Horas formatadas
                dataHoraCriacao: dataCriacaoObj.toLocaleString('pt-BR'), // Ex: 21/11/2025 14:30:00
                
                dataHoraResolucao: dataResolucaoObj ? dataResolucaoObj.toLocaleString('pt-BR') : 'Não resolvido',
                
                // Se precisar só da hora separada:
                horaCriacao: dataCriacaoObj.toLocaleTimeString('pt-BR'),
                horaResolucao: dataResolucaoObj ? dataResolucaoObj.toLocaleTimeString('pt-BR') : '--:--'
            };
        });

        return chamadosFormatados;

    } catch (error) {
        console.error("Falha no Model:", error.message);
        throw error;
    }
}

module.exports = { buscarChamados };