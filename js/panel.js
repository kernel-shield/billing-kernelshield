KS.requireLogin();

const user = KS.getUser();
document.getElementById('userLabel').textContent = `${user.first} ${user.last}`;
document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  KS.logout();
});

let metodosData = [];

async function cargarSuscripciones() {
  const box = document.getElementById('subsBox');
  try {
    const { suscripciones } = await KS.apiFetch('/payments/subscriptions/me');
    if (!suscripciones.length) {
      box.innerHTML = '<p class="empty">Todavía no tenés ninguna suscripción activa. Elegí un plan abajo y reportá tu pago.</p>';
      return;
    }
    box.innerHTML = `<table><thead><tr><th>Plan</th><th>Inicio</th><th>Vence</th><th>Estado</th></tr></thead><tbody>
      ${suscripciones.map(s => `
        <tr>
          <td>${s.plan_nombre}</td>
          <td>${KS.fmtDate(s.fecha_inicio)}</td>
          <td>${KS.fmtDate(s.fecha_fin)}</td>
          <td><span class="badge ${s.estado}">${s.estado}</span></td>
        </tr>
      `).join('')}
    </tbody></table>`;
  } catch (err) {
    box.innerHTML = `<div class="error-box">${err.message}</div>`;
  }
}

async function cargarPlanesSelect() {
  const select = document.getElementById('plan_id');
  try {
    const { planes } = await KS.apiFetch('/plans');
    select.innerHTML = planes.map(p => `<option value="${p.id}">${p.nombre} — ${KS.fmtMoney(p.precio, p.moneda)}</option>`).join('');
  } catch (err) {
    select.innerHTML = '<option>No se pudieron cargar los planes</option>';
  }
}

async function cargarMetodosSelect() {
  const select = document.getElementById('metodo_pago');
  const info = document.getElementById('metodoDatos');
  try {
    const { metodos } = await KS.apiFetch('/plans/metodos-pago');
    metodosData = metodos;
    select.innerHTML = metodos.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('');
    const actualizarInfo = () => {
      const m = metodosData.find(x => x.nombre === select.value);
      info.textContent = m ? `Datos: ${m.datos}` : '';
    };
    select.addEventListener('change', actualizarInfo);
    actualizarInfo();
  } catch (err) {
    select.innerHTML = '<option>No se pudieron cargar</option>';
  }
}

async function cargarPagos() {
  const box = document.getElementById('pagosBox');
  try {
    const { pagos } = await KS.apiFetch('/payments/me');
    if (!pagos.length) {
      box.innerHTML = '<p class="empty">Todavía no reportaste ningún pago.</p>';
      return;
    }
    box.innerHTML = `<table><thead><tr><th>Plan</th><th>Monto</th><th>Método</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>
      ${pagos.map(p => `
        <tr>
          <td>${p.plan_nombre}</td>
          <td>${KS.fmtMoney(p.monto, p.moneda)}</td>
          <td>${p.metodo_pago}</td>
          <td>${KS.fmtDate(p.fecha_pago)}</td>
          <td><span class="badge ${p.estado}">${p.estado}</span>${p.estado === 'rechazado' && p.motivo_rechazo ? `<div class="subtitle" style="margin:4px 0 0; font-size:12px;">${p.motivo_rechazo}</div>` : ''}</td>
        </tr>
      `).join('')}
    </tbody></table>`;
  } catch (err) {
    box.innerHTML = `<div class="error-box">${err.message}</div>`;
  }
}

document.getElementById('payForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('payMsg');
  msg.innerHTML = '';
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const formData = new FormData();
    formData.append('plan_id', document.getElementById('plan_id').value);
    formData.append('metodo_pago', document.getElementById('metodo_pago').value);
    formData.append('monto', document.getElementById('monto').value);
    formData.append('referencia', document.getElementById('referencia').value);
    const file = document.getElementById('comprobante').files[0];
    if (file) formData.append('comprobante', file);

    await KS.apiFetch('/payments', { method: 'POST', body: formData });
    msg.innerHTML = '<div class="ok-box">Pago reportado. Vas a ver el estado abajo una vez lo revisemos.</div>';
    e.target.reset();
    cargarPagos();
  } catch (err) {
    msg.innerHTML = `<div class="error-box">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reportar pago';
  }
});

cargarSuscripciones();
cargarPlanesSelect();
cargarMetodosSelect();
cargarPagos();
