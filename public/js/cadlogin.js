const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})
const voltarLink = document.querySelector('.voltar-link');
const voltarIcon = document.querySelector('.voltar-icon-img');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    voltarLink.style.color = '#fff';
    voltarIcon.src = 'Images/voltar-branco.svg'; 
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    voltarLink.style.color = '#333';
    voltarIcon.src = 'Images/voltar.svg'; 
});
