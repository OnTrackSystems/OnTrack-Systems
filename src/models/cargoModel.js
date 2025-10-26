var database = require("../database/config");

function cadastrarCargo(fkEmpresa, nome) {
    let instrucao = `
        INSERT INTO Cargo (nome, fkEmpresa) VALUES ('${nome}', ${fkEmpresa});
    `;
    return database.executar(instrucao);
}

function listarCargos(fkEmpresa) {
    let instrucao = `
        SELECT * FROM Cargo WHERE fkEmpresa = ${fkEmpresa};
    `;
    return database.executar(instrucao);
}

function removerCargo(idCargo) {
    let instrucao = `
        DELETE FROM Cargo WHERE idCargo = ${idCargo};
    `;
    return database.executar(instrucao);
}

// ========== PERMISSÕES ==========
function listarPermissoes() {
    let instrucao = `
        SELECT * FROM Permissao;
    `;
    return database.executar(instrucao);
}

function listarPermissoesPorCargo(idCargo) {
    let instrucao = `
        SELECT 
            p.idPermissao,
            p.nome,
            p.descricao,
            IF(cp.fkPermissao IS NULL, 0, 1) AS ativo
        FROM Permissao p
        LEFT JOIN CargoPermissao cp
        ON p.idPermissao = cp.fkPermissao AND cp.fkCargo = ${idCargo};
    `;
    return database.executar(instrucao);
}

function adicionarPermissaoCargo(idCargo, idPermissao) {
    let instrucao = `
        INSERT IGNORE INTO CargoPermissao (fkCargo, fkPermissao)
        VALUES (${idCargo}, ${idPermissao});
    `;
    return database.executar(instrucao);
}

function removerPermissaoCargo(idCargo, idPermissao) {
    let instrucao = `
        DELETE FROM CargoPermissao
        WHERE fkCargo = '${idCargo}' AND fkPermissao = '${idPermissao}';
    `;
    return database.executar(instrucao);
}


module.exports = {
    cadastrarCargo,
    listarCargos,
    removerCargo,
    listarPermissoes,
    listarPermissoesPorCargo,
    adicionarPermissaoCargo,
    removerPermissaoCargo
};
