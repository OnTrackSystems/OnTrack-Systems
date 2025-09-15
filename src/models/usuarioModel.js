var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    var instrucaoSql = `
        SELECT idUsuario, nome, email, acesso, fkempresa FROM usuarios WHERE email = '${email}' AND senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
function cadastrar(nome, email, senha, cpf, telefone, acesso, fkEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, cpf, telefone, acesso, fkEmpresa);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `insert into usuarios (nome,email,senha,cpf,telefone,acesso,fkEmpresa)
                        values ("${nome}","${email}","${senha}",${cpf},${telefone},"${acesso}",${fkEmpresa});
        
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}
function buscarUsuarios(idEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function buscarUsuarios():", idEmpresa);
    var instrucaoSql = `
        SELECT * FROM usuarios WHERE fkempresa = ${idEmpresa};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}
function buscarUsuariosPesquisa(idEmpresa, nome) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function buscarUsuarios():", idEmpresa);
    var instrucaoSql = `
        SELECT * FROM usuarios WHERE fkempresa = ${idEmpresa} and nome LIKE "${nome}%";
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
}
function deletarUsuarios(idUsuario){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function deletarUsuarios():", idUsuario);
    
    var instrucaoSql=`DELETE FROM usuarios where idUsuario=${idUsuario}`
     console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)

}
function editarUsuarios(idUsuario, nome, email, acesso, senha, telefone,cpf){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function editarUsuarios():", idUsuario, nome, email);
    
    var instrucaoSql=`UPDATE usuarios SET nome='${nome}', email='${email}', acesso='${acesso}',senha='${senha}',telefone='${telefone}', cpf='${cpf}' WHERE idUsuario=${idUsuario}`;
     console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)

}
function carregarUsuario(idUsuario){
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function carregarUsuarios():", idUsuario);
    var instrucaoSql = `
        SELECT * FROM usuarios WHERE idUsuario = ${idUsuario};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql)
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