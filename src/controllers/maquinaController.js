var maquinaModel = require("../models/maquinaModel");

function listarPorEmpresa(req, res) {
    var idEmpresa = req.query.idEmpresa;
    if (!idEmpresa) {
        return res.status(400).send("idEmpresa é obrigatório");
    }

    maquinaModel.listarPorEmpresa(idEmpresa)
        .then(resultado => {
            const maquinas = [];

            resultado.forEach(row => {
                let maquina = maquinas.find(m => m.idMaquina === row.idMaquina);
                if (!maquina) {
                    maquina = {
                        idMaquina: row.idMaquina,
                        empresa: row.empresa,
                        componentes: []
                    };
                    maquinas.push(maquina);
                }

                if (row.nomeComponente) {
                    maquina.componentes.push({
                        idComponenteHardware: row.idComponenteHardware,
                        componente: row.nomeComponente,
                        unidade: row.unidadeMedida,
                        parametroMax: row.parametroMax,
                        parametroMin: row.parametroMin
                    });
                }
            });

            res.json(maquinas);
        })
        .catch(erro => {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function adicionarServidor(req, res) {
    let uuid = req.body.uuid;
    let idEmpresa = req.body.idEmpresa;

    maquinaModel.adicionarServidor(uuid, idEmpresa).then((resultado) => {
        res.status(200).send("✅ Servidor cadastrado com sucesso!");
    });
}

function buscarServidorUUID(req, res) {
    let uuid = req.params.uuid;

    maquinaModel.buscarServidorUUID(uuid).then((resultado) => {
        if(resultado.length == 1) {
            res.status(200).send("Servidor encontrado");
        } else {
            res.status(403).send("UUID do servidor não encontrada");    
        }
    });
}

function atualizarServidor(req, res) {
    let uuid = req.body.uuid;
    let modeloCPU = req.body.modeloCPU;
    let qtdRam = req.body.qtdRam;
    let qtdDisco = req.body.qtdDisco;
    let sistemaOperacional = req.body.sistemaOperacional;

    maquinaModel.atualizarServidor(uuid, modeloCPU, qtdRam, qtdDisco, sistemaOperacional).then((resultado) => {
        res.status(200).send("✅ Servidor atualizado com sucesso!");
    });
}

async function adicionarComponente(req, res) {
    try {
        const { idMaquina, componentes } = req.body;

        if (!idMaquina || !componentes) {
            return res.status(400).send("Dados inválidos");
        }

        // Inserir parâmetros
        for (const c of componentes) {
            await maquinaModel.cadastrarParametro(
                idMaquina,
                c.idComponente,
                c.parametroMin,
                c.parametroMax
            );
        }

        res.status(201).send("Máquina cadastrada com sucesso!");
    } catch (erro) {
        console.log(erro);
        res.status(500).json(erro.sqlMessage);
    }
}

async function excluirComponente(req, res) {
    try {
        const idMaquina = req.params.idMaquina;
        const idComponente = req.params.idComponente;

        if (!idMaquina || !idComponente) {
            return res.status(400).send("Parâmetros inválidos");
        }

        await maquinaModel.excluirParametro(idMaquina, idComponente);

        res.status(200).send("Componente excluído com sucesso!");
    } catch (err) {
        console.error(err);
        res.status(500).json(err.sqlMessage);
    }
}

async function listar(req, res) {
    try {
        const componentes = await maquinaModel.listar();
        res.json(componentes);
    } catch (erro) {
        console.log("Erro ao listar componentes:", erro);
        res.status(500).json(erro.sqlMessage);
    }
}

async function editar(req, res) {
  const { updates } = req.body;

  try {
    for (let u of updates) {
      await maquinaModel.editarParametro(u.antigoId, u.novoId, u.parametroMin, u.parametroMax);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao editar parâmetros" });
  }
}

// Excluir máquina
async function excluir(req, res) {
    try {
        const idMaquina = req.params.idMaquina;

        if (!idMaquina) {
            return res.status(400).send("idMaquina é obrigatório");
        }

        await maquinaModel.excluirMaquina(idMaquina);

        res.status(200).send("Máquina excluída com sucesso!");
    } catch (erro) {
        console.log(erro);
        res.status(500).json(erro.sqlMessage);
    }
}

module.exports = {
    listarPorEmpresa,
    listar,
    editar,
    excluir,
    adicionarComponente,
    excluirComponente,
    adicionarServidor,
    buscarServidorUUID,
    atualizarServidor
};
