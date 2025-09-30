var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");

        return;
    }
    
    if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");

        return;
    }

    usuarioModel.autenticar(email, senha).then((resultado) => {
        res.json(resultado);
    });
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var idCargo = req.body.idCargoServer;
    let idEmpresa = req.body.idEmpresaServer;

    usuarioModel.cadastrar(nome, email, senha, idCargo, idEmpresa)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function buscarUsuarios(req, res) {
    var idEmpresa = req.params.idEmpresa;

    usuarioModel.buscarUsuarios(idEmpresa)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao buscar os usuarios! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );
}
function buscarUsuariosPesquisa(req, res) {
    var idEmpresa = req.params.idEmpresa;
    var nome = req.params.nome;

    usuarioModel.buscarUsuariosPesquisa(idEmpresa, nome)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao buscar os usuarios! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );
}
function deletarUsuarios(req, res) {
    var idUsuario = req.params.idUsuario;
    usuarioModel.deletarUsuarios(idUsuario)
        .then(function (resultado) {
            res.json(resultado)
        }).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao deletar os usuarios! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        )
}
function editarUsuarios(req, res) {
    var idUsuario = req.params.idUsuario;
    var cpf = req.body.cpfServer;
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var acesso = req.body.acessoServer;
    var senha = req.body.senhaServer;
    var telefone = req.body.telefoneServer;

    usuarioModel.editarUsuarios(idUsuario, nome, email, acesso, senha, telefone, cpf)
        .then(function (resultado) {
            res.json(resultado)
        }).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao editar os usuarios! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        )

}
function carregarUsuario(req, res) {
    var idUsuario = req.params.idUsuario;
    usuarioModel.carregarUsuario(idUsuario)
        .then(function (resultado) {
            res.json(resultado)
        }).catch(
            function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao carregar os usuarios! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        )

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