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

function cadastrarMaquina(idMaquina, idEmpresa) {
    var instrucaoSql = `
        INSERT INTO maquinas (idMaquina, fkEmpresa)
        VALUES (${idMaquina}, ${idEmpresa});
    `;

    return database.executar(instrucaoSql);
}

function cadastrarParametro(idMaquina, idComponente, parametroMin, parametroMax) {
    var instrucaoSql = `
        INSERT INTO parametros (fkMaquina, fkComponenteHardware, parametroMin, parametroMax)
        VALUES (${idMaquina}, ${idComponente}, ${parametroMin}, ${parametroMax});
    `;
    return database.executar(instrucaoSql);
}

function listar() {
    var instrucaoSql = `
        SELECT idComponenteHardware, nomeComponente, unidadeMedida
        FROM componentesHardware;
    `;

    return database.executar(instrucaoSql);
}

function editarParametro(antigoId, novoId, parametroMin, parametroMax) {
  const instrucaoSql = `
    UPDATE parametros
    SET parametroMin = '${parametroMin}', 
        parametroMax = '${parametroMax}', 
        fkComponenteHardware = '${novoId}'
    WHERE fkComponenteHardware = ${antigoId};
  `;

  console.log("Executando SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluirParametro(idMaquina, idComponente) {
    const sql = `
        DELETE FROM parametros
        WHERE fkMaquina = ${idMaquina} AND fkComponenteHardware = ${idComponente};
    `;
    return database.executar(sql);
}

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
    editarParametro,
    excluirMaquina,
    listar,
    excluirParametro
};
