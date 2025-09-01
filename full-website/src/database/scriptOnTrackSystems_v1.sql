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
  acesso VARCHAR(20) NOT NULL,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE INDEX email_UNIQUE (email),
  UNIQUE INDEX cpf_UNIQUE (cpf),
  FOREIGN KEY (fkEmpresa) REFERENCES empresas (idEmpresa)
);


CREATE TABLE avisos (
  idAvisos INT NOT NULL,
  dataHora DATETIME NULL,
  RAM FLOAT NULL,
  CPU FLOAT NULL,
  disco FLOAT NULL,
  tempoI_O INT NULL,
  PacotesEnv INT NULL,
  PacotesRec INT NULL,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idavisos),
  FOREIGN KEY (fkEmpresa) REFERENCES empresas (idEmpresa)
  );
 
insert into empresas (nome,CNPJ,endereco)
values("SPTrans",60498417000158,"Rua Boa Vista, 236 – Centro, São Paulo/SP");

insert into usuarios (nome,email,senha,cpf,telefone,acesso,fkEmpresa)
values ("Ronaldo","admin@sptrans.com",123,12345678909,1191234-5678,"Administrador",1);