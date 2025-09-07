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
  fotoPerfil VARCHAR(200),
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE INDEX email_UNIQUE (email),
  UNIQUE INDEX cpf_UNIQUE (cpf),
  FOREIGN KEY (fkEmpresa) REFERENCES empresas (idEmpresa)
  );



CREATE TABLE maquinas (
  idMaquina INT NOT NULL AUTO_INCREMENT,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idMaquina),
  FOREIGN KEY (fkEmpresa) REFERENCES empresas (idEmpresa)
  );



CREATE TABLE  componentesHardware (
  idComponenteHardware INT NOT NULL AUTO_INCREMENT,
  nomeComponente VARCHAR(20) NULL,
  unidadeMedida VARCHAR(20) NULL,
  PRIMARY KEY (idComponenteHardware)
  );	
  
insert into componentesHardware (nomeComponente, unidadeMedida) values
('CPU', '%'),
('RAM', '%'),
('DISCO', 'GB'),
('REDE', 'Pacotes'),
('REDE', 'Tempo I/O');

CREATE TABLE parametros (
  idParametros INT NOT NULL AUTO_INCREMENT,
  fkMaquina INT NOT NULL,
  fkComponenteHardware INT NOT NULL,
  parametroMax DOUBLE NULL,
  parametroMin DOUBLE NULL,
  PRIMARY KEY (idParametros),
  FOREIGN KEY (fkMaquina) REFERENCES maquinas (idMaquina),
  FOREIGN KEY (fkComponenteHardware) REFERENCES componentesHardware (idComponenteHardware)
  );



select * from maquinas;

insert into empresas (nome,CNPJ,endereco)
values("SPTrans",60498417000158,"Rua Boa Vista, 236 – Centro, São Paulo/SP");

insert into usuarios (nome,email,senha,cpf,telefone,acesso,fkEmpresa)
values ("Ronaldo","admin@sptrans.com",123,12345678909,1191234-5678,"Administrador",1);





  