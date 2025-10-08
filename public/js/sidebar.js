

side.innerHTML = `<div id="SideNav" class="sideBar">
  <a href="javascript:void(0)" class="botaoFechar" onclick="fecharNav()">&times;</a>
  <a href="#">Dashboard</a>
  <a href="#">Controle de Usuários</a>
  <a href="#">Controle de Máquinas</a>
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