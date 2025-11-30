side.innerHTML = `<div id="SideNav" class="sideBar">
  <a href="javascript:void(0)" class="botaoFechar" onclick="fecharNav()">&times;</a>
  <a href="dashboard.html">Dashboard</a>
  <a href="controle_usuarios.html">Controle de Usuários</a>
  <a href="controle_maquinas.html">Controle de Máquinas</a>
  <a href="controle_maquinas.html">Cargos</a>
  <a onclick="desconectar()" id="textoSide">Desconectar</a>
</div>

<div id="main">
  <span style="font-size:30px;cursor:pointer" onclick="abrirNav()">&#9776; </span>
</div>`

function abrirNav() {
  document.getElementById("SideNav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function fecharNav() {
  document.getElementById("SideNav").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}

function desconectar() {
    sessionStorage.clear();

    window.location = "index.html";
}