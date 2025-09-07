var database = require("../database/config");

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT m.idMaquina,
            e.nome AS empresa,
            p.idParametros,
            ch.idComponenteHardware,
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
    var sql = `
        INSERT INTO maquinas (idMaquina, fkEmpresa)
        VALUES (${idMaquina}, ${idEmpresa});
    `;
    return database.executar(sql);
}

// Inserir parâmetros (sem criar componente novo)
function cadastrarParametro(idMaquina, idComponente, parametroMin, parametroMax) {
    var sql = `
        INSERT INTO parametros (fkMaquina, fkComponenteHardware, parametroMin, parametroMax)
        VALUES (${idMaquina}, ${idComponente}, ${parametroMin}, ${parametroMax});
    `;
    return database.executar(sql);
}

// Buscar todos os componentes
function listar() {
    var instrucao = `
        SELECT idComponenteHardware, nomeComponente, unidadeMedida
        FROM componentesHardware;
    `;
    return database.executar(instrucao);
}

function editarComponente(idComponenteHardware, nomeComponente, unidadeMedida) {
    const instrucaoSql = `
        UPDATE componentesHardware
        SET nomeComponente = '${nomeComponente}', unidadeMedida = '${unidadeMedida}'
        WHERE idComponenteHardware = ${idComponenteHardware};
    `;
    console.log("Executando SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function editarHardware(idComponenteHardware, parametroMin, parametroMax){
    const instrucaoSql = `
        UPDATE parametros
        SET parametroMIn = '${parametroMin}', parametroMax = '${parametroMax}'
        WHERE fkComponenteHardware = ${idComponenteHardware};
    `;
    console.log("Executando SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

// Excluir máquina (remove parâmetros, depois a máquina)
async function excluirMaquina(idMaquina) {
    var deleteParametros = `DELETE FROM parametros WHERE fkMaquina = ${idMaquina};`;
    await database.executar(deleteParametros);

    var deleteMaquina = `DELETE FROM maquinas WHERE idMaquina = ${idMaquina};`;
    return database.executar(deleteMaquina);
}

module.exports = {
    listarPorEmpresa,
    cadastrarMaquina,
    cadastrarParametro,
    editarComponente,
    editarHardware,
    excluirMaquina,
    listar
};
