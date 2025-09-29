var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else {

        usuarioModel.autenticar(email, senha)
            .then(
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`); // transforma JSON em String

                    if (resultadoAutenticar.length == 1) {
                        res.json({
                            idUsuario: resultadoAutenticar[0].idUsuario,
                            email: resultadoAutenticar[0].email,
                            nome: resultadoAutenticar[0].nome,
                            senha: resultadoAutenticar[0].senha,
                            acesso: resultadoAutenticar[0].acesso,
                            fkempresa: resultadoAutenticar[0].fkempresa

                        });
                    } else if (resultadoAutenticar.length == 0) {
                        res.status(403).send("Email e/ou senha inválido(s)");
                    } else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

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