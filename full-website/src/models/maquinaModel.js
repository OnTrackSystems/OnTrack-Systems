var database = require("../database/config");

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT m.idMaquina,
            e.nome AS empresa,
            p.idParametros,
            ch.nomeComponente,
            ch.unidadeMedida,        
            p.parametroMax,
            p.parametroMin
        FROM maquinas m
        JOIN empresas e 
            ON m.fkEmpresa = e.idEmpresa
        LEFT JOIN parametros p 
            ON p.fkMaquina = m.idMaquina
        LEFT JOIN componentesHardware ch 
            ON ch.idComponenteHardware = p.fkComponenteHardware
        WHERE m.fkEmpresa = ${idEmpresa};
    `;
    console.log("Executando SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Inserir máquina
function cadastrarMaquina(idMaquina, idEmpresa) {
    var instrucaoSql = `
        INSERT INTO maquinas (idMaquina, fkEmpresa) VALUES (${idMaquina}, ${idEmpresa});
    `;
    console.log("Executando SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Inserir componentes e parâmetros
async function cadastrarComponente(idMaquina, nomeComponente, unidadeMedida, parametroMin, parametroMax) {
    // 1. Inserir componente se não existir
    var instrucaoComponente = `
        INSERT INTO componentesHardware (nomeComponente, unidadeMedida)
        VALUES ('${nomeComponente}', '${unidadeMedida}')
        ON DUPLICATE KEY UPDATE unidadeMedida = VALUES(unidadeMedida);
    `;
    await database.executar(instrucaoComponente);

    // 2. Buscar id do componente
    var busca = `
        SELECT idComponenteHardware FROM componentesHardware WHERE nomeComponente = '${nomeComponente}';
    `;
    let result = await database.executar(busca);
    let idComponente = result[0].idComponenteHardware;

    // 3. Inserir parâmetros
    var instrucaoParametro = `
        INSERT INTO parametros (fkMaquina, fkComponenteHardware, parametroMin, parametroMax)
        VALUES (${idMaquina}, ${idComponente}, ${parametroMin}, ${parametroMax});
    `;
    return database.executar(instrucaoParametro);
}

module.exports = {
    listarPorEmpresa,
    cadastrarMaquina,
    cadastrarComponente
};
