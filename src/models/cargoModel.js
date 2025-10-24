var database = require("../database/config");

function cadastrarCargo(fkEmpresa, nome) {
    let instrucao = `
        INSERT INTO Cargo (nome, fkEmpresa) VALUES ('${nome}', ${fkEmpresa});
    `;

    return database.executar(instrucao);
}

function listarCargos(fkEmpresa) {
    let instrucao = `
        SELECT * FROM Cargo WHERE fkEmpresa = '${fkEmpresa}';
    `;
    return database.executar(instrucao);
}

function removerCargo(idCargo) {
    let instrucao = `
        DELETE FROM Cargo WHERE idCargo = '${idCargo}';
    `;
    return database.executar(instrucao);
}

module.exports = {
    cadastrarCargo,
    listarCargos,
    removerCargo
};
