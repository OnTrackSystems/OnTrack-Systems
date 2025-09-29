CREATE DATABASE IF NOT EXISTS OnTrackSystems;
USE OnTrackSystems;

CREATE TABLE Empresa (
	idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45) NOT NULL,
	cnpj CHAR(14) NOT NULL,
	ativo TINYINT NOT NULL,
	aprovada TINYINT NOT NULL,
	dataCadastro DATE,
	UNIQUE INDEX CNPJ_UNIQUE(CNPJ)
);

CREATE TABLE Cargo (
	idCargo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45) NOT NULL,
    dataCadastro DATE NOT NULL,
	fkEmpresa INT NOT NULL,
CONSTRAINT fkCargoEmpresa
	FOREIGN KEY (fkEmpresa)
    REFERENCES Empresa(idEmpresa)
);
  
CREATE TABLE Usuario (
	idUsuario INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45) NOT NULL,
	email VARCHAR(200) NOT NULL,
	senha VARCHAR(255) NOT NULL,
	fotoPerfil VARCHAR(200),
    dataCadastro DATE NOT NULL,
    fkCargo INT NOT NULL,
	UNIQUE INDEX email_UNIQUE(email),
CONSTRAINT fkUsuarioCargo
	FOREIGN KEY (fkCargo)
    REFERENCES Cargo(idCargo)
);

CREATE TABLE Maquina (
	idMaquina INT PRIMARY KEY AUTO_INCREMENT,
	fkEmpresa INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    uuid CHAR(36) NOT NULL,
    dataCadastro DATE NOT NULL,
CONSTRAINT fkMaquinaEmpresa
	FOREIGN KEY (fkEmpresa) 
    REFERENCES Empresa(idEmpresa)
);

CREATE TABLE ComponenteHardware (
  idComponenteHardware INT PRIMARY KEY AUTO_INCREMENT,
  nomeComponente VARCHAR(20) NOT NULL,
  unidadeMedida VARCHAR(20) NOT NULL
);	
  
insert into componentesHardware (nomeComponente, unidadeMedida) VALUES
('CPU', '%'),
('CPU', 'Tempo I/O'),
('RAM', '%'),
('DISCO', 'GB'),
('REDE', 'Pacotes');

CREATE TABLE Parametro (
	idParametro INT PRIMARY KEY AUTO_INCREMENT,
	fkMaquina INT NOT NULL,
	fkComponenteHardware INT NOT NULL,
    descricao VARCHAR(45) NULL,
	parametroMax DOUBLE NULL,
	parametroMin DOUBLE NULL,
CONSTRAINT fkParametroMaquina
	FOREIGN KEY (fkMaquina)
    REFERENCES Maquina(idMaquina),
CONSTRAINT fkParametroComponente
	FOREIGN KEY (fkComponenteHardware)
    REFERENCES ComponenteHardware(idComponenteHardware)
);

insert into empresas (nome,CNPJ,endereco)
values("SPTrans",60498417000158,"Rua Boa Vista, 236 – Centro, São Paulo/SP");

insert into usuarios (nome,email,senha,cpf,telefone,acesso,fkEmpresa)
values ("Ronaldo","admin@sptrans.com",123,12345678909,1191234-5678,"Administrador",1);
