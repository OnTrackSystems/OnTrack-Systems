var database = require("../database/config");

function listarPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT m.idMaquina,
            e.nome AS empresa
        FROM Maquina m
        INNER JOIN Empresa e 
            ON m.fkEmpresa = e.idEmpresa
        WHERE m.fkEmpresa = ${idEmpresa};
    `;
    
    console.log("Executando SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarServidor(uuid, idEmpresa) {
    let nome = `Servidor ${uuid.substring(0, 8)}`;
    let instrucaoSql = `
        INSERT INTO Maquina (uuid, nome, fkEmpresa) VALUES
            ('${uuid}', '${nome}', '${idEmpresa}');
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
        INSERT INTO parametros (fkMaquina, fkComponenteHardware, parametroMin, parametroMax)
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

module.exports = {
    listarPorEmpresa,
    cadastrarMaquina,
    cadastrarParametro,
    editarParametro,
    excluirMaquina,
    listarComponentes,
    excluirParametro,
    adicionarServidor,
    buscarServidorUUID,
    atualizarServidor
};
