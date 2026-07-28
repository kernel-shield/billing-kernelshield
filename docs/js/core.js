// Cambia esto por tu dominio real de la API una vez deployada en Render
const API_BASE = 'https://billing-kernelshield.onrender.com/api';

const KS = {
  getToken() {
    return localStorage.getItem('ks_token');
  },
  setSession(token, user) {
    localStorage.setItem('ks_token', token);
    localStorage.setItem('ks_user', JSON.stringify(user));
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('ks_user'));
    } catch {
      return null;
    }
  },
  clearSession() {
    localStorage.removeItem('ks_token');
    localStorage.removeItem('ks_user');
  },
  requireLogin() {
    if (!this.getToken()) {
      window.location.href = 'login.html';
    }
  },
  requireAdmin() {
    const user = this.getUser();
    if (!this.getToken() || !user || user.rol !== 'admin') {
      window.location.href = 'login.html';
    }
  },
  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },
  // fetch con JSON, agrega el token si existe
  async apiFetch(path, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    return data;
  },
  fmtDate(str) {
    if (!str) return '-';
    const d = new Date(str);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  },
  fmtMoney(amount, currency) {
    return `${Number(amount).toFixed(2)} ${currency || 'USD'}`;
  }
};
