// Minimal client-side auth UI logic
const apiBase = '';

function showToast(msg, type='info'){
  if (window.iziToast) {
    if (type === 'success') iziToast.success({ title: 'OK', message: msg });
    else if (type === 'error') iziToast.error({ title: 'Error', message: msg });
    else iziToast.info({ title: 'Info', message: msg });
  } else {
    alert(msg);
  }
}

function $(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', () => {
  const loginTab = $('tab-login');
  const registerTab = $('tab-register');
  const loginForm = $('login-form');
  const registerForm = $('register-form');

  loginTab.addEventListener('click', () => { loginTab.classList.add('active'); registerTab.classList.remove('active'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); });
  registerTab.addEventListener('click', () => { registerTab.classList.add('active'); loginTab.classList.remove('active'); registerForm.classList.remove('hidden'); loginForm.classList.add('hidden'); });

  $('login-submit').addEventListener('click', async () => {
    const identifier = $('login-identifier').value.trim();
    const password = $('login-password').value;
    if (!identifier || !password) return showToast('Provide both identifier and password', 'error');

    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Login failed', 'error');

      // Save tokens in localStorage (simple) — future: use httpOnly cookie
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Logged in', 'success');
      setTimeout(() => { window.location = '/'; }, 800);
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  });

  $('register-submit').addEventListener('click', async () => {
    const username = $('reg-username').value.trim();
    const email = $('reg-email').value.trim();
    const password = $('reg-password').value;
    if (!username || !email || !password) return showToast('Complete all fields', 'error');

    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Registration failed', 'error');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Account created', 'success');
      setTimeout(() => { window.location = '/'; }, 800);
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  });
});
