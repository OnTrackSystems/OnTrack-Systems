let database = require("../database/config");

function listarGaragens(fkEmpresa) {
    let instrucaoSql =  `
        SELECT nome,
            idGaragem
        FROM Garagem
        WHERE fkEmpresa = ${fkEmpresa};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    listarGaragens
}