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

// Cadastro de máquina
async function cadastrar(req, res) {
    try {
        const { idMaquina, idEmpresa, componentes } = req.body;

        if (!idEmpresa || !idMaquina || !componentes || componentes.length === 0) {
            return res.status(400).send("Dados inválidos para cadastro da máquina");
        }

        // 1. Inserir máquina
        const maquina = await maquinaModel.cadastrarMaquina(idMaquina, idEmpresa);

        // 2. Inserir parâmetros/componentes
        for (const c of componentes) {
            await maquinaModel.cadastrarComponente(
                maquina.insertId,
                c.nomeComponente,
                c.unidade,
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

async function editar(req, res) {
    try {
        const { idComponenteHardware, nomeComponente, unidadeMedida, parametroMin, parametroMax } = req.body;

        console.log("Dados recebidos na edição:", req.body);

        if (!idComponenteHardware || !nomeComponente || !unidadeMedida || !parametroMin || !parametroMax) {
            return res.status(400).send("Dados inválidos para edição");
        }

        await maquinaModel.editarComponente(idComponenteHardware, nomeComponente, unidadeMedida, parametroMin, parametroMax);
        await maquinaModel.editarHardware(idComponenteHardware, parametroMin, parametroMax);

        res.status(200).json({ message: "Componente editado com sucesso" });
    } catch (erro) {
        console.error("Erro ao editar componente:", erro);
        res.status(500).json(erro.sqlMessage || "Erro interno do servidor");
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
    cadastrar,
    editar,
    excluir
};
