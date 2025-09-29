let database = require("../database/config");

function cadastrarCargo(fkEmpresa, nome) {
    let instrucaoSql = `
        INSERT INTO Cargo(nome, fkEmpresa)
        VALUES ('${nome}', ${fkEmpresa});
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarCargo
}