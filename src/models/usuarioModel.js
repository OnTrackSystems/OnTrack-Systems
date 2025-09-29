var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha);

    var instrucaoSql = `
        SELECT * FROM Usuario 
        WHERE email = '${email}' AND senha = '${senha}';
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkCargo) {    
    var instrucaoSql = `
        INSERT INTO Usuario (nome, email, senha, fkCargo)
        VALUES ("${nome}", "${email}", "${senha}", ${fkCargo});
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarUsuarios(idEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function buscarUsuarios():", idEmpresa);

    var instrucaoSql = `
        SELECT * FROM Usuario WHERE fkempresa = ${idEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}

function buscarUsuariosPesquisa(idEmpresa, nome) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function buscarUsuarios():", idEmpresa);

    var instrucaoSql = `
        SELECT * FROM Usuario 
        WHERE fkempresa = ${idEmpresa} AND 
        nome LIKE "%${nome}%";
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}

function deletarUsuarios(idUsuario){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function deletarUsuarios():", idUsuario);
    
    var instrucaoSql = `
        DELETE FROM Usuario
        WHERE idUsuario = ${idUsuario}
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}

function editarUsuarios(idUsuario, nome, email, acesso, senha, telefone,cpf){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function editarUsuarios():", idUsuario, nome, email);
    
    var instrucaoSql=`
        UPDATE Usuario 
        SET nome = '${nome}', 
            email = '${email}', 
            senha = '${senha}',
        WHERE idUsuario = ${idUsuario}
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}

function carregarUsuario(idUsuario){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function carregarUsuarios():", idUsuario);

    var instrucaoSql = `
        SELECT * FROM usuarios WHERE idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    buscarUsuarios,
    buscarUsuariosPesquisa,
    deletarUsuarios,
    editarUsuarios,
    carregarUsuario
}