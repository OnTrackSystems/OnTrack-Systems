CREATE DATABASE IF NOT EXISTS OnTrackSystems;
USE OnTrackSystems;

CREATE TABLE Empresa (
	idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45) NOT NULL,
	cnpj CHAR(14) NOT NULL,
	ativo TINYINT NOT NULL,
	aprovada TINYINT NOT NULL,
	dataCadastro DATE NOT NULL DEFAULT (CURRENT_DATE())
);

CREATE TABLE Cargo (
	idCargo INT AUTO_INCREMENT,
    nome VARCHAR(45) NOT NULL,
    dataCadastro DATE NOT NULL DEFAULT (CURRENT_DATE()),
	fkEmpresa INT NOT NULL,
CONSTRAINT fkCargoEmpresa
	FOREIGN KEY (fkEmpresa)
    REFERENCES Empresa(idEmpresa),
PRIMARY KEY(idCargo, fkEmpresa)
);

CREATE TABLE Permissao (
	idPermissao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50),
    descricao VARCHAR(200)
);

INSERT INTO Permissao (nome, descricao) VALUES
('Visualizar máquinas', 'Permite visualizar dados'),
('Editar usuários', 'Permite editar usuários'),
('Excluir máquina', 'Permite excluir máquinas'),
('Cadastrar usuários', 'Permite cadastrar novos usuários'),
('Gerenciar usuários', 'Permite gerenciar usuários e permissões');

CREATE TABLE CargoPermissao (
	fkCargo INT,
    fkPermissao INT,
CONSTRAINT fkCargo
	FOREIGN KEY (fkCargo)
    REFERENCES Cargo(idCargo),
CONSTRAINT fkPermissao
	FOREIGN KEY (fkPermissao)
    REFERENCES Permissao(idPermissao),
PRIMARY KEY(fkCargo, fkPermissao)
);
  
CREATE TABLE Usuario (
	idUsuario INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45) NOT NULL,
	email VARCHAR(200) NOT NULL,
	senha VARCHAR(255) NOT NULL,
	fotoPerfil VARCHAR(200),
    dataCadastro DATE NOT NULL DEFAULT (CURRENT_DATE()),
    fkCargo INT NOT NULL,
    fkEmpresa INT NOT NULL,
	UNIQUE INDEX email_UNIQUE(email),
CONSTRAINT fkUsuarioCargo
	FOREIGN KEY (fkCargo, fkEmpresa)
    REFERENCES Cargo(idCargo, fkEmpresa)
);

CREATE TABLE Garagem (
	idGaragem INT AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    fkEmpresa INT NOT NULL,
CONSTRAINT fkGaragemEmpresa
	FOREIGN KEY (fkEmpresa)
    REFERENCES Empresa(idEmpresa),
PRIMARY KEY(idGaragem, fkEmpresa)
);

CREATE TABLE Maquina (
	idMaquina INT PRIMARY KEY AUTO_INCREMENT,
    fkGaragem INT NOT NULL,
	fkEmpresa INT NOT NULL,
    uuid CHAR(36) NOT NULL,
    dataCadastro DATE NOT NULL DEFAULT (CURRENT_DATE()),
CONSTRAINT fkMaquinaGaragem
	FOREIGN KEY(fkGaragem, fkEmpresa)
    REFERENCES Garagem(idGaragem, fkEmpresa)
);

CREATE TABLE ComponenteHardware (
  idComponenteHardware INT PRIMARY KEY AUTO_INCREMENT,
  nomeComponente VARCHAR(20) NOT NULL,
  unidadeMedida VARCHAR(20) NOT NULL
);	
  
INSERT INTO ComponenteHardware (nomeComponente, unidadeMedida) VALUES
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

SELECT * FROM Cargo;
SELECT * FROM Empresa;
SELECT * FROM Usuario;
SELECT * FROM Maquina;
SELECT * FROM Parametro;
SELECT * FROM Garagem;

SELECT g.idGaragem,
	g.nome,
	m.uuid
FROM Garagem g
INNER JOIN Maquina m
	ON g.idGaragem = m.fkGaragem
WHERE g.fkEmpresa = 1;

SELECT p.parametroMax,
            p.parametroMin,
            c.nomeComponente,
            c.unidadeMedida
        FROM Parametro p
        INNER JOIN ComponenteHardware c
            ON p.fkComponenteHardware = c.idComponenteHardware
        WHERE p.fkMaquina = 1;