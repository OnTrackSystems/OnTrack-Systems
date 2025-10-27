#!/bin/bash

echo "🔄 Atualizando lista de pacotes..."
sudo apt update

echo "📦 Instalando Java Runtime, Java Development Kit, Git e Python..."
sudo apt install default-jre -y
sudo apt install default-jdk -y
sudo apt install git -y
sudo apt install python3 -y
sudo apt install python3-pip -y

# Instalar as dependências Python via apt
echo "📦 Instalando as bibliotecas Python necessárias via apt..."
sudo apt install python3-psutil python3-pandas python3-boto3 -y  # Instalando bibliotecas via apt

# Verificar se o repositório Java já foi clonado
if [ -d "OnTrackSystems.Software" ]; then
    echo "📂 Repositório Java já existe, fazendo git pull..."
    cd OnTrackSystems.Software
    git pull
    cd ..
else
    echo "📁☕ Clonando o repositório Java..."
    git clone https://github.com/OnTrackSystems/OnTrackSystems.Software.git
fi

cd OnTrackSystems.Software

echo "Cadastrando máquina..."

java -jar cadastrarServidor.jar

java -jar monitoramentoSpTrans.jar &

python3 monitoramento.py &


echo "✅ Processo concluído!"


