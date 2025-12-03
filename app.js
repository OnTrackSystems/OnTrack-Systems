var ambiente_processo = 'producao';
var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env.dev' : '.env.dev';
// Acima, temos o uso do operador ternário para definir o caminho do arquivo .env
// A sintaxe do operador ternário é: condição ? valor_se_verdadeiro : valor_se_falso

require("dotenv").config({ path: caminho_env });


var express = require("express");
var cors = require("cors");
var path = require("path");
var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();

var usuarioRouter = require("./src/routes/usuarios");
var maquinaRouter = require("./src/routes/maquina");
var emailRouter = require("./src/routes/email");
var empresaRouter = require("./src/routes/empresas");
var cargoRouter = require("./src/routes/cargos");
var garagemRouter = require("./src/routes/garagens");
var chamadosRouter = require("./src/routes/chamados");
var dashDadosController = require("./src/routes/dashDados");
var dashTransferenciaDadosController = require("./src/routes/dashTransferenciaDados");
var preditivaRouter = require("./src/routes/preditiva");
var geralRouter = require("./src/routes/geral");
var realTimeRouter = require("./src/routes/realTime");


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.use("/usuarios", usuarioRouter);
app.use("/email", emailRouter);
app.use("/maquina", maquinaRouter);
app.use("/empresas", empresaRouter);
app.use("/cargos", cargoRouter);
app.use("/garagens", garagemRouter);
app.use("/dashDados", dashDadosController);
app.use("/dashTransferenciaDados", dashTransferenciaDadosController);
app.use("/preditiva", preditivaRouter);
app.use("/geral", geralRouter);
app.use("/realTime", realTimeRouter);
app.use("/chamados", chamadosRouter);

app.listen(PORTA_APP, function () {
    console.log(`
    /^^^^              /^^^ /^^^^^^                        /^^     
  /^^    /^^                /^^                            /^^     
/^^        /^^/^^ /^^       /^^    /^ /^^^   /^^       /^^^/^^  /^^
/^^        /^^ /^^  /^^     /^^     /^^    /^^  /^^  /^^   /^^ /^^ 
/^^        /^^ /^^  /^^     /^^     /^^   /^^   /^^ /^^    /^/^^   
  /^^     /^^  /^^  /^^     /^^     /^^   /^^   /^^  /^^   /^^ /^^ 
    /^^^^     /^^^  /^^     /^^    /^^^     /^^ /^^^   /^^^/^^  /^^
                                                                   
  /^^ ^^                    /^^                                    
/^^    /^^                  /^^                                    
 /^^      /^^   /^^ /^^^^ /^/^ /^   /^^    /^^^ /^^ /^^  /^^^^     
   /^^     /^^ /^^ /^^      /^^   /^   /^^  /^^  /^  /^^/^^        
      /^^    /^^^    /^^^   /^^  /^^^^^ /^^ /^^  /^  /^^  /^^^     
/^^    /^^    /^^      /^^  /^^  /^         /^^  /^  /^^    /^^    
  /^^ ^^     /^^   /^^ /^^   /^^   /^^^^   /^^^  /^  /^^/^^ /^^    Based: WEB-DATA-VIZ
           /^^                                                     
    \n\n
                                                                       
    OnTrack Systems Rodando: http://${HOST_APP}:${PORTA_APP} :. \n\n
    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:. \n
    `);
});
