var database = require("../database/config");

function cadastrarCargo(fkEmpresa, nome) {
    let instrucao = `
        INSERT INTO Cargo (nome, fkEmpresa) VALUES ('${nome}', ${fkEmpresa});
    `;

    return database.executar(instrucao, [nome, fkEmpresa]);
}

function listarCargos(fkEmpresa) {
    let instrucao = `
        SELECT * FROM Cargo WHERE fkEmpresa = ?;
    `;
    return database.executar(instrucao, [fkEmpresa]);
}

function excluirCargo(idCargo, fkEmpresa) {
    let instrucao = `
        DELETE FROM Cargo WHERE idCargo = ? AND fkEmpresa = ?;
    `;
    return database.executar(instrucao, [idCargo, fkEmpresa]);
}

module.exports = {
    cadastrarCargo,
    listarCargos,
    excluirCargo
};
