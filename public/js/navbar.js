nav.innerHTML = `
    <div class="container-fluid ">
       <div id="SideNav" class="sideBar">
  <a href="javascript:void(0)" class="botaoFechar" onclick="fecharNav()">&times;</a>
  <a href="dashboard.html">Dashboard</a>
  <a href="controle_usuarios.html">Controle de Usuários</a>
  <a href="controle_maquinas.html">Controle de Máquinas</a>
  <a onclick="desconectar()" id="textoSide">Desconectar</a>
</div>

<div id="main">
  <span style="font-size:30px;cursor:pointer" onclick="abrirNav()">&#9776; </span>
</div>
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

// offcanvasNavbar.innerHTML = `
//     <div class="categoriaSection">
//         <h1>Navegação</h1>
//         <div class="collapseOptions">
//             <div class="collapseSection">
//                 <div onclick="virarSeta(setaDashboard)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseDashboards" role="button" aria-expanded="false" aria-controls="collapseDashboards">
//                     <img src="../Images/home.svg">
//                     <h2>Dashboards</h2>
//                     <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaDashboard">
//                 </div>
//                 <div class="collapse" id="collapseDashboards">
//                     <div class="collapsePages">
//                         <a href="dashboard.html" class="link-underline link-underline-opacity-0"><h3 role="button">Estatísticas</h3></a>
//                         <h3 role="button">Gráficos</h3>
//                     </div>
//                 </div>
//             </div>
//             <div class="collapseSection">
//                 <div onclick="virarSeta(setaServers)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseServers" role="button" aria-expanded="false" aria-controls="collapseServers">
//                     <img src="../Images/serverIcon.svg">
//                     <h2>Servidores</h2>
//                     <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaServers">
//                 </div>
//                 <div class="collapse" id="collapseServers">
//                     <div class="collapsePages">
//                         <h3 role="button">Informações Gerais</h3>
//                         <a href="servidores.html" class="link-underline link-underline-opacity-0"><h3 role="button">Configurar Servidores</h3></a>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </div>
//     <h1>Configurações</h1>
// `;

if (sessionStorage.ID_EMPRESA == 1) {
    offcanvasNavbar.innerHTML += `
        <div class="collapseSection">
            <div class="collapseTitulo" role="button" aria-expanded="false">
                <img src="../Images/empresaIcon.svg">
                <a href="empresas.html" class="link-underline link-underline-opacity-0"><h2>Empresas</h2></a>
            </div>
        </div>
    `;
}

// offcanvasNavbar.innerHTML += `
//     <div class="collapseSection">
//         <div onclick="virarSeta(setaUsuarios)" class="collapseTitulo" data-bs-toggle="collapse" href="#collapseUsuarios" role="button" aria-expanded="false" aria-controls="collapseUsuarios">
//             <img src="../Images/userIcon.svg">
//             <h2>Usuários</h2>
//             <img src="../Images/chevron_right.svg" class="setaBaixo" id="setaUsuarios">
//         </div>
//         <div class="collapse" id="collapseUsuarios">
//             <div class="collapsePages">
//                 <a href="usuarios.html" class="link-underline link-underline-opacity-0"><h3 role="button">Usuários</h3></a>
//                 <a href="cargos.html" class="link-underline link-underline-opacity-0"><h3 role="button">Cargos</h3></a>
//             </div>
//         </div>
//     </div>
//     <div class="collapseSection logout" onclick="desconectar()">
//         <div class="collapseTitulo" role="button" aria-expanded="false">
//             <img src="../Images/logoutIcon.svg">
//             <h2>Desconectar</h2>
//         </div>
//     </div>
// `;

function virarSeta(idSeta) {
    if (idSeta.classList.contains('rotate-90')) {
        idSeta.classList.remove('rotate-90');
    } else {
        idSeta.classList.add('rotate-90')
    }
}

function desconectar() {
    sessionStorage.clear();

    window.location = "index.html";
}

function abrirNav() {
  document.getElementById("SideNav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function fecharNav() {
  document.getElementById("SideNav").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}