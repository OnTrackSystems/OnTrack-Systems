DROP DATABASE IF EXISTS OnTrackSystems;
CREATE DATABASE OnTrackSystems;
USE OnTrackSystems;

CREATE TABLE empresas (
  idEmpresa INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(45) NOT NULL,
  CNPJ CHAR(14) NOT NULL,
  endereco VARCHAR(50) NOT NULL,
  PRIMARY KEY (idEmpresa),
  UNIQUE INDEX CNPJ_UNIQUE (CNPJ)
  );
  

CREATE TABLE usuarios (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(45) NOT NULL,
  email VARCHAR(45) NOT NULL,
  senha VARCHAR(45) NOT NULL,
  cpf CHAR(11) NOT NULL,
  telefone CHAR(11) NOT NULL,
  cargo VARCHAR(45) NOT NULL,
  funcao VARCHAR(45) NOT NULL,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE INDEX email_UNIQUE (email),
  UNIQUE INDEX senha_UNIQUE (senha),
  UNIQUE INDEX cpf_UNIQUE (cpf),
  FOREIGN KEY (fkEmpresa) REFERENCES empresa (idEmpresa)
);


CREATE TABLE avisos (
  idavisos INT NOT NULL,
  dataHora DATETIME NULL,
  RAM FLOAT NULL,
  CPU FLOAT NULL,
  disco FLOAT NULL,
  tempoI_O INT NULL,
  PacotesEnv INT NULL,
  PacotesRec INT NULL,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idavisos),
  FOREIGN KEY (fkEmpresa) REFERENCES empresa (idEmpresa)
  );
 
