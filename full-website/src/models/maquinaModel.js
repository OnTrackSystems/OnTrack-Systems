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
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarPorEmpresa
}
