
const JIRA_DOMAIN = 'https://ontracksys.atlassian.net'; 
const USER_EMAIL = 'thiago.fukunaga@sptech.school' 
const API_TOKEN = 'ATATT3xFfGF0bFFvkBL-qsTqSgrwl97cyQ3DG3KUFOJmB6LUhJQPXtiTrQ1HVTOqOOh03cv1I6mlYIdDdfLLxNQ-UjVx8R_3CBukZNkyz8taGuBPACn2NhOaRgnqgzeNHYUtP8nBnmzaWshkACQFxpw4YkZG8rNyjITMmhoOvNCviw-7HNm0eCA=99D74C61'; 


async function buscarChamadosAbertos() {
    try {
        const endpoint = '/rest/api/3/search/jql';
        
        const jqlQuery = 'project = CHAMADOS ORDER BY created DESC';
        
        const queryParams = new URLSearchParams({
            jql: jqlQuery,
            fields: 'summary,status,priority,description,created,assignee'
        });

        const urlCompleta = `${JIRA_DOMAIN}${endpoint}?${queryParams.toString()}`;

        console.log(`Tentando conectar em: ${urlCompleta}`); 

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
            throw new Error(`Erro na API do Jira: ${response.status} - ${response.statusText}. Detalhes: ${errorBody}`);
        }

        const json = await response.json();
        // tratamento
        const chamadosFormatados = json.issues.map(issue => {
            return {
                id: issue.key,
                titulo: issue.fields.summary,
                
                status: issue.fields.status ? issue.fields.status.name : 'Sem Status',
                corStatus: issue.fields.status && issue.fields.status.statusCategory ? issue.fields.status.statusCategory.colorName : 'blue-gray',
                
                prioridade: issue.fields.priority ? issue.fields.priority.name : 'Normal',
                
                dataCriacao: new Date(issue.fields.created).toLocaleDateString('pt-BR'),
                
                responsavel: issue.fields.assignee ? issue.fields.assignee.displayName : 'Não atribuído'
            };
        });

        return chamadosFormatados;

    } catch (error) {
        console.error("Falha no Model:", error.message);
        throw error; 
    }
}

module.exports = { buscarChamadosAbertos };