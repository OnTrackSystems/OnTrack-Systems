var database = require("../database/config");

function adicionarGaragem(idGaragem, nomeGaragem, latitudeGaragem, longitudeGaragem) {
    let instrucaoSql =  `
        INSERT INTO Garagem (idGaragem, nome, latitude, longitude) VALUES
            ('${idGaragem}', '${nomeGaragem}', ${latitudeGaragem}, ${longitudeGaragem});
    `;

    database.executar(instrucaoSql);
}

module.exports = {
    adicionarGaragem
}