nav.innerHTML = `
    <div class="container-fluid ">
        <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar"
            aria-controls="offcanvasNavbar" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <a href="index.html"><img src="./assets/imgs/logo_BG_escuro.png" alt="Logo"
                style="width: 150px; height: auto; margin-left: 10px;"></a>
        <div class="ms-auto d-flex align-items-center justify-content-center">
            <i class="fa-regular fa-bell " style="font-size: 25px;"></i>
            <div class=" rounded-circle overflow-hidden d-flex align-items-center justify-content-center m-3"
                style="width: 50px; height: 50px;">
                <img src="./assets/imgs/usuarioicon.png" alt="Perfil" style="width: auto; height: 50px; ">
            </div>
        </div>


        <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasNavbar">
            
        </div>
    </div>
`;

offcanvasNavbar.innerHTML = `
    <div class="categoriaSection">
        <h1>Navegação</h1>
        <div class="collapseOptions">
            <div class="collapseSection">
                <div onclick="virarSeta(setaDashboard)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseDashboards" role="button" aria-expanded="false" aria-controls="collapseDashboards">
                    <img src="../Images/home.svg">
                    <h2>Dashboards</h2>
                    <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaDashboard">
                </div>
                <div class="collapse" id="collapseDashboards">
                    <div class="collapsePages">
                        <a href="dashboard.html" class="link-underline link-underline-opacity-0"><h3 role="button">Estatísticas</h3></a>
                        <h3 role="button">Gráficos</h3>
                    </div>
                </div>
            </div>
            <div class="collapseSection">
                <div onclick="virarSeta(setaServers)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseServers" role="button" aria-expanded="false" aria-controls="collapseServers">
                    <img src="../Images/serverIcon.svg">
                    <h2>Servidores</h2>
                    <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaServers">
                </div>
                <div class="collapse" id="collapseServers">
                    <div class="collapsePages">
                        <h3 role="button">Informações Gerais</h3>
                        <a href="servidores.html" class="link-underline link-underline-opacity-0"><h3 role="button">Configurar Servidores</h3></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <h1>Configurações</h1>
`;

if(sessionStorage.ID_EMPRESA == 1) {
    offcanvasNavbar.innerHTML += `
        <div class="collapseSection">
            <div class="collapseTitulo" role="button" aria-expanded="false">
                <img src="../Images/empresaIcon.svg">
                <a href="empresas.html" class="link-underline link-underline-opacity-0"><h2>Empresas</h2></a>
            </div>
        </div>
    `;
}

offcanvasNavbar.innerHTML += `
    <div class="collapseSection">
        <div onclick="virarSeta(setaUsuarios)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseUsuarios" role="button" aria-expanded="false" aria-controls="collapseUsuarios">
            <img src="../Images/userIcon.svg">
            <h2>Usuários</h2>
            <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaUsuarios">
        </div>
        <div class="collapse" id="collapseUsuarios">
            <div class="collapsePages">
                <a href="usuarios.html" class="link-underline link-underline-opacity-0"><h3 role="button">Usuários</h3></a>
                <a href="cargos.html" class="link-underline link-underline-opacity-0"><h3 role="button">Cargos</h3></a>
            </div>
        </div>
    </div>
    <div class="collapseSection logout" onclick="desconectar()">
        <div class="collapseTitulo" role="button" aria-expanded="false">
            <img src="../Images/logoutIcon.svg">
            <h2>Desconectar</h2>
        </div>
    </div>
`;

function virarSeta(idSeta) {
    if(idSeta.classList.contains('rotate-90')) {
        idSeta.classList.remove('rotate-90');
    } else {
        idSeta.classList.add('rotate-90')
    }
}

function desconectar() {
    sessionStorage.clear();

    window.location = "index.html";
}