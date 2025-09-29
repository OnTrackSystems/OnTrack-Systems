let database = require("../database/config");

function cadastrarEmpresa(nome, cnpj) {
    let instrucaoSql = `
        INSERT INTO Empresa(nome, cnpj, ativo, aprovada) VALUES
            ('${nome}', '${cnpj}', 1, 0);
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarEmpresa
}