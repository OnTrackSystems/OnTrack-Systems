document.addEventListener("DOMContentLoaded", function () {

    if (window.innerWidth > 992) {
        document.body.classList.add('sidebar-collapsed');
    }

    const sidebarHTML = `
        <nav id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="./assets/imgs/mini_logo_icon.png" alt="OnTrack" width="40" height="40" style="object-fit: contain;">
                    <span class="logo-text" style="margin-left: 10px;">OnTrack</span>
                </div>
            </div>

            <ul class="nav flex-column sidebar-nav">
                
                <!-- ITEM DASHBOARDS (DROPDOWN) -->
                <li class="nav-item">
                    <a id="dash-toggle" class="nav-link" href="javascript:void(0)" style="justify-content: space-between; align-items: center; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-tachometer-alt"></i>
                            <span class="nav-link-text">Dashboards</span>
                        </div>
                        <i id="dash-arrow" class="fas fa-chevron-right nav-link-text" style="font-size: 0.8rem; transition: transform 0.3s;"></i>
                    </a>
                    
                    <!-- SUBMENU (Sempre inicia oculto) -->
                    <ul id="dash-submenu" style="display: none; list-style: none; padding: 0; background-color: rgba(0,0,0,0.05);">
                        <li>
                            <a class="nav-link" href="dashboardDados.html" style="padding-left: 3.5rem; font-size: 0.9em;">
                                <span class="nav-link-text">Dados Técnicos</span>
                            </a>
                        </li>
                        <li>
                            <a class="nav-link" href="dashboardPreditivaBia.html" style="padding-left: 3.5rem; font-size: 0.9em;">
                                <span class="nav-link-text">Tendências</span>
                            </a>
                        </li>
                         <li>
                            <a class="nav-link" href="dashboardChamados.html" style="padding-left: 3.5rem; font-size: 0.9em;">
                                <span class="nav-link-text">Chamados</span>
                            </a>
                        </li>
                        <li>
                            <a class="nav-link" href="dashboardTransferenciaDadosPedro.html" style="padding-left: 3.5rem; font-size: 0.9em;">
                                <span class="nav-link-text">Transferência de Dados</span>
                            </a>
                        </li>
                        <li>
                            <a class="nav-link" href="dashboardRealTimeBruno.html" style="padding-left: 3.5rem; font-size: 0.9em;">
                                <span class="nav-link-text">Componentes</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- DEMAIS ITENS -->
                <li class="nav-item">
                    <a class="nav-link" href="maquinas.html">
                        <i class="fas fa-robot"></i><span class="nav-link-text">Máquinas</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="controle_usuarios.html">
                        <i class="fas fa-chart-bar"></i><span class="nav-link-text">Usuários</span>
                    </a>
                </li>
                 <li class="nav-item">
                    <a class="nav-link" href="cargos.html">
                        <i class="fa-solid fa-briefcase"></i><span class="nav-link-text">Cargos</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" onclick="desconectar()" style="cursor: pointer;">
                        <i class="fas fa-sign-out-alt"></i><span class="nav-link-text">Sair</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHTML;
    }

    const navbarHTML = `
        <nav class="navbar fixed-top">
            <div class="container-fluid" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center;">
                    <button class="btn" type="button" id="sidebar-toggle" style="margin-right: 15px; border:none; background:none;">
                        <i class="fas fa-bars fa-lg"></i>
                    </button>
                    <h1 class="text-xl font-bold text-slate-800 ml-4 hidden sm:block" style="margin: 0; font-size: 1.25rem; font-weight: 700;">Visão Global da Infraestrutura</h1>
                </div>
                
                <div class="d-flex align-items-center ms-auto" style="display: flex; gap: 20px; align-items: center;">
                    <a class="nav-link" href="#" style="color: #64748b;"><i class="fas fa-bell fa-lg"></i></a>
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%;">
                </div>
            </div>
        </nav>
    `;

    const navbarContainer = document.getElementById("navbar-container");
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;
    }

    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        sidebar.addEventListener('mouseenter', function () {
            if (window.innerWidth > 992) {
                document.body.classList.remove('sidebar-collapsed');
            }
        });

        sidebar.addEventListener('mouseleave', function () {
            if (window.innerWidth > 992) {
                document.body.classList.add('sidebar-collapsed');
                
                const submenu = document.getElementById('dash-submenu');
                const arrow = document.getElementById('dash-arrow');
                if (submenu && arrow) {
                    submenu.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    const dashToggle = document.getElementById('dash-toggle');
    const dashSubmenu = document.getElementById('dash-submenu');
    const dashArrow = document.getElementById('dash-arrow');

    if (dashToggle && dashSubmenu) {
        dashToggle.addEventListener('click', function(e) {
            e.preventDefault();
            this.blur(); 
            
            if (document.body.classList.contains('sidebar-collapsed') && window.innerWidth > 992) {
                document.body.classList.remove('sidebar-collapsed');
            }

            if (dashSubmenu.style.display === 'none') {
                dashSubmenu.style.display = 'block';
                if(dashArrow) dashArrow.style.transform = 'rotate(90deg)';
            } else {
                dashSubmenu.style.display = 'none';
                if(dashArrow) dashArrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    const currentPage = window.location.pathname.split("/").pop();
    const subLinks = document.querySelectorAll("#dash-submenu a");
    const mainLinks = document.querySelectorAll("#sidebar .nav-link:not(#dash-toggle)");

    subLinks.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
            link.style.fontWeight = "bold";
        }
    });

    mainLinks.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });

    const sidebarToggleMobile = document.getElementById('sidebar-toggle');
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-open');
        });
    }
});

function desconectar() {
    sessionStorage.clear();
    window.location = "index.html";
}