var maquinaModel = require("../models/maquinaModel");

function listarPorEmpresa(req, res) {
    var idEmpresa = req.query.idEmpresa;
    if (!idEmpresa) {
        return res.status(400).send("idEmpresa é obrigatório");
    }

    maquinaModel.listarPorEmpresa(idEmpresa)
        .then(resultado => {
            // tratamento: agrupar por idMaquina
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

module.exports = {
    listarPorEmpresa
};
