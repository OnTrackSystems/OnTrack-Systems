document.addEventListener("DOMContentLoaded", function () {
    
    const sidebarHTML = `
        <nav id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="./assets/imgs/mini_logo_icon.png" alt="OnTrack Systems" width="50" height="50">
                     <span class="logo-text">OnTrack Systems</span>
                </div>
            </div>

            <ul class="nav flex-column sidebar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="../dashboard.html">
                        <i class="fas fa-tachometer-alt"></i><span class="nav-link-text">Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../controle_maquinas.html">
                        <i class="fas fa-robot"></i><span class="nav-link-text">Máquinas</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../maquinas.html">
                        <i class="fas fa-chart-bar"></i><span class="nav-link-text">Controle de Usuários</span>
                    </a>
                </li>
                 <li class="nav-item">
                    <a class="nav-link" href="../cargos.html">
                        <i class="fa-solid fa-briefcase"></i><span class="nav-link-text">Cargos</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" onclick="desconectar()">
                        <i class="fas fa-users"></i><span class="nav-link-text">Desconectar</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHTML;
    }

    if (window.innerWidth > 992) {
        document.body.classList.add('sidebar-collapsed');
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
            }
        });
    }

    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll("#sidebar .nav-link");

    navLinks.forEach(link => {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const navbarHTML = `
        <nav class="navbar fixed-top">
            <div class="container-fluid">
                <button class="btn" type="button" id="sidebar-toggle">
                    <i class="fas fa-bars fa-lg"></i>
                </button>
                
                <div class="d-flex align-items-center ms-auto">
                    <ul class="navbar-nav flex-row">
                        <li class="nav-item me-3">
                            <a class="nav-link" href="#"><i class="fas fa-bell fa-lg"></i></a>
                        </li>
                        <li class="nav-item">
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" class="user-avatar">
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;

    const navbarContainer = document.getElementById("navbar-container");
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;
    }

    const sidebarToggleMobile = document.getElementById('sidebar-toggle');
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-open');
        });
    }

    
});

if(!sessionStorage.ID_EMPRESA) {
    window.location = "index.html";
}

function desconectar() {
    sessionStorage.clear();

    window.location = "index.html";
}