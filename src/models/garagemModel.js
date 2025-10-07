var database = require("../database/config");

function adicionarGaragem(idGaragem, nomeGaragem, latitudeGaragem, longitudeGaragem, fkEmpresa) {
    let instrucaoSql =  `
        INSERT INTO Garagem (idGaragem, nome, latitude, longitude, fkEmpresa) VALUES
            ('${idGaragem}', '${nomeGaragem}', ${latitudeGaragem}, ${longitudeGaragem}, ${fkEmpresa});
    `;

    return database.executar(instrucaoSql);
}

function verificarGaragemNome(nomeGaragem) {
    let instrucaoSql = `
        SELECT * FROM Garagem
        WHERE nome = '${nomeGaragem}';
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    adicionarGaragem,
    verificarGaragemNome
}