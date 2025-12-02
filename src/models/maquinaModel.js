var database = require("../database/config");

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT m.idMaquina,
            e.nome AS empresa,
            m.fkGaragem
        FROM Maquina m
        INNER JOIN Empresa e 
            ON m.fkEmpresa = e.idEmpresa
        WHERE m.fkEmpresa = ${idEmpresa};
    `;
    
    console.log("Executando SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarMaquinas(idEmpresa) {
    let instrucaoSql = `
        SELECT g.idGaragem,
            g.nome,
            m.uuid,
            m.idMaquina
        FROM Garagem g
        INNER JOIN Maquina m
            ON g.idGaragem = m.fkGaragem
        WHERE g.fkEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function adicionarServidor(uuid, idEmpresa, idGaragem, tamanhoDisco) {
    let instrucaoSql = `
        INSERT INTO Maquina (uuid, fkEmpresa, fkGaragem, tamanhoDisco) VALUES
            ('${uuid}', ${idEmpresa}, ${idGaragem}, ${tamanhoDisco});
    `;

    return database.executar(instrucaoSql);
}

function buscarServidorUUID(uuid) {
    let instrucaoSql = `
        SELECT * FROM Maquina
        WHERE uuid = '${uuid}'
    `;

    return database.executar(instrucaoSql);
}

function atualizarServidor(uuid, modeloCPU, qtdRam, qtdDisco, sistemaOperacional) {
    let instrucaoSql = `
        UPDATE Maquina
        SET modeloCPU = '${modeloCPU}',
            qtdRam = '${qtdRam}',
            qtdDisco = '${qtdDisco}',
            sistemaOperacional = '${sistemaOperacional}'
        WHERE uuid = '${uuid}';
    `;

    return database.executar(instrucaoSql);
}

function cadastrarParametro(idMaquina, idComponente, parametroMin, parametroMax) {
    var instrucaoSql = `
        INSERT INTO Parametro(fkMaquina, fkComponenteHardware, parametroMin, parametroMax)
        VALUES (${idMaquina}, ${idComponente}, ${parametroMin}, ${parametroMax});
    `;

    return database.executar(instrucaoSql);
}

function listarComponentes() {
    var instrucaoSql = `
        SELECT idComponenteHardware, nomeComponente, unidadeMedida
        FROM ComponenteHardware;
    `;

    return database.executar(instrucaoSql);
}

function editarParametro(antigoId, novoId, parametroMin, parametroMax) {
  const instrucaoSql = `
    UPDATE Parametro
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
        DELETE FROM Parametro
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

function listarParametros(idMaquina) {
    let instrucaoSql = `
        SELECT p.parametroMax,
            p.parametroMin,
            c.nomeComponente,
            c.unidadeMedida
        FROM Parametro p
        INNER JOIN ComponenteHardware c
            ON p.fkComponenteHardware = c.idComponenteHardware
        WHERE p.fkMaquina = ${idMaquina};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    listarMaquinas,
    cadastrarParametro,
    editarParametro,
    excluirMaquina,
    listarComponentes,
    excluirParametro,
    adicionarServidor,
    buscarServidorUUID,
    atualizarServidor,
    listarPorEmpresa,
    listarParametros
};
