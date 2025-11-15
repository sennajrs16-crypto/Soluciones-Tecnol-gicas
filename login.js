// Gestión de login
const AUTH_USER_KEY = 'pyme_current_user';
const ALLOWED_USERS = [
  { name: 'Milton Fernando Quintero Lozano', password: '300528', role: 'vendedor' },
  { name: 'Maria Alejandra Quintero Santamaria', password: '05498756', role: 'admin' },
  { name: 'Invitado', password: '', role: 'invitado' }
];

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const errorMsg = document.getElementById('error-msg');

  // Habilitar/deshabilitar campo contraseña según usuario
  if (loginUsername) {
    loginUsername.addEventListener('change', () => {
      if (loginUsername.value === 'Invitado') {
        loginPassword.value = '';
        loginPassword.disabled = true;
        loginPassword.style.background = '#e5e5e5';
      } else {
        loginPassword.disabled = false;
        loginPassword.style.background = '';
      }
    });
  }

  // Si ya está autenticado, ir a index.html o vendor.html
  const currentUser = localStorage.getItem(AUTH_USER_KEY);
  if (currentUser) {
    const user = ALLOWED_USERS.find(u => u.name === currentUser);
    if (user) {
      window.location.href = user.role === 'vendedor' ? 'vendor.html' : 'index.html';
    } else {
      // Si el usuario guardado es inválido, eliminarlo para permitir acceso al login
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const u = loginUsername ? loginUsername.value.trim() : '';
      const p = loginPassword ? loginPassword.value : '';

      // Limpiar mensaje de error
      errorMsg.classList.remove('show');
      errorMsg.textContent = '';


      if (!u) {
        errorMsg.textContent = 'Por favor selecciona un usuario.';
        errorMsg.classList.add('show');
        return;
      }

      const user = ALLOWED_USERS.find(x => x.name === u);
      if (!user) {
        errorMsg.textContent = 'Usuario no autorizado.';
        errorMsg.classList.add('show');
        return;
      }

      if (user.name !== 'Invitado' && p !== user.password) {
        errorMsg.textContent = 'Contraseña incorrecta.';
        errorMsg.classList.add('show');
        return;
      }

      // Guardar sesión y redirigir según rol
      localStorage.setItem(AUTH_USER_KEY, u);
      if (user.role === 'vendedor') {
        window.location.href = 'vendor.html';
      } else if (user.role === 'admin') {
        window.location.href = 'index.html';
      } else {
        window.location.href = 'index.html';
      }
    });
  }
});
