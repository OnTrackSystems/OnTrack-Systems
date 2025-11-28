let chamadosModel = require("../models/chamadosModel");

function listarChamados(req,res){
    chamadosModel.buscarChamados().then((resultado) => {
        res.status(200).json(resultado);
    });
}

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3'); // requisitando o pacote

async function getCallsFromBucket(req, res){
    
    const s3Client = new S3Client({
        region: "us-east-1",
         credentials: {
            accessKeyId: "ASIA4WILKHQM7ZMLQ5BD",
            secretAccessKey: "XsKG29wvD9pT1yMHFQSv1NSWzHPKikUpayhvFOhq",
            sessionToken: "IQoJb3JpZ2luX2VjEO3//////////wEaCXVzLXdlc3QtMiJHMEUCIC8RoOGXvtgQNMpXYV7OnmtX774VfJULXSxzjE3YaTBXAiEAtnqaBdIrqTLPEGbcXa6zPRZ5h9g/DRRAbYjZe13JyU0qwAIItv//////////ARABGgw4NzI0Mzg5NzE0MTciDLMhBSHHEqYaRwSZeiqUAk8r+U/1W2t+PLmdyJgwvIssy6DE462ThrGz5caJFm6EE4IvomsoRVaO2M0hKbbWa+nvUitu+w+cI6kgovYbf6bSojzWyGYnBTziJWIhfmz4UVRKooNbyN+hNEuFLShvt2TtN/XeHzEw2V09DeBLQFM5FmB4j4IYY0oQd3vUEC8hKLqlUm28LwtFpUNIvGRlD8YxYU5rbgebzyKrDm7EfCvHq520LCPSgnu6lbscm8Ryb7oe8vZ2HaWPMxbi3ba7SVM50d3rbGZG44dAznmR5WQGg7TFzePOQqqvGUAS3/DbFBDDzrQCDALFDND6Zto/+eeW0d5USfVNSI6mu04Sw6oG8/gQ8CbRvmPvGn6VUy0dyLDMOTD4vqbJBjqdAe5Ej2DSU/lBZgBvBt0ekpGNk6l/JnH5AcosZVkF1JO3lwhp+ZvtVNNthhrKtYRLsYRTd1hDkW9lFx4IDZO1OaR0t4XTPfrq2093k3OCzpbUfGWGCT0mV8r2KhclhqUdWIMUTn40HGM1eJS7gwAxQhBM03oKuxJGtwxsGjVnGMjLIZfP6ImzjsmeubzgQrfxpSrze/t2hHacWdQ4qDw="
        } // tem que configuar isso aq pra puxar do bucket
    });

    const input = {
        Bucket: "awsontrackclient",  // nome do bucket
        Key: "chamados_dashboard.json" // nome do arquivo que voce esta puxando do bucket
    }

    const command = new GetObjectCommand(input);
    const response = await s3Client.send(command);
    const bytes = await response.Body.transformToByteArray();

    const jsonString = Buffer.from(bytes).toString("utf-8");
    const data = JSON.parse(jsonString); // essa variável "data", é o nome do json que vai vir no fetch

    // bloco acima é pra transformar do jeito que eles pegam do bucket, para json string. 
    console.log(data)
    return res.status(200).json(data)
}

module.exports={
    getCallsFromBucket,
    listarChamados
}