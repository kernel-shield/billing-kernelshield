KS.requireAdmin();

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  KS.logout();
});

async function cargarPendientes() {
  const box = document.getElementById('pendientesBox');
  try {
    const { pagos } = await KS.apiFetch('/admin/payments?estado=pendiente');
    if (!pagos.length) {
      box.innerHTML = '<p class="empty">No hay pagos pendientes por revisar.</p>';
      return;
    }
    box.innerHTML = pagos.map(p => `
      <div class="card" style="margin-bottom:12px;" id="pago-${p.id}">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div>
            <strong>${p.first} ${p.last}</strong> <span class="subtitle" style="margin:0;">(${p.email})</span><br>
            <span class="subtitle" style="margin:4px 0;">Plan: ${p.plan_nombre} · Monto: ${KS.fmtMoney(p.monto, p.moneda)} · Método: ${p.metodo_pago}</span><br>
            ${p.referencia ? `<span class="subtitle" style="margin:0;">Referencia: ${p.referencia}</span><br>` : ''}
            ${p.comprobante_url ? `<a href="${p.comprobante_url}" target="_blank" rel="noopener">Ver comprobante</a>` : '<span class="subtitle">Sin comprobante adjunto</span>'}
          </div>
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <button onclick="aprobarPago(${p.id})">Aprobar</button>
            <button class="danger" onclick="rechazarPago(${p.id})">Rechazar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    box.innerHTML = `<div class="error-box">${err.message}</div>`;
  }
}

async function aprobarPago(id) {
  if (!confirm('¿Aprobar este pago y activar la suscripción?')) return;
  try {
    await KS.apiFetch(`/admin/payments/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ dias_duracion: 30 })
    });
    cargarPendientes();
  } catch (err) {
    alert(err.message);
  }
}

async function rechazarPago(id) {
  const motivo = prompt('Motivo del rechazo (el cliente lo va a ver):');
  if (motivo === null) return;
  try {
    await KS.apiFetch(`/admin/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ motivo })
    });
    cargarPendientes();
  } catch (err) {
    alert(err.message);
  }
}

async function cargarUsuarios() {
  const box = document.getElementById('usersBox');
  try {
    const { users } = await KS.apiFetch('/admin/users');
    box.innerHTML = `<table><thead><tr><th>Nombre</th><th>Email</th><th>País</th><th>Rol</th><th>Registrado</th></tr></thead><tbody>
      ${users.map(u => `
        <tr>
          <td>${u.first} ${u.last}</td>
          <td>${u.email}</td>
          <td>${u.country || '-'}</td>
          <td>${u.rol}</td>
          <td>${u.created_at}</td>
        </tr>
      `).join('')}
    </tbody></table>`;
  } catch (err) {
    box.innerHTML = `<div class="error-box">${err.message}</div>`;
  }
}

cargarPendientes();
cargarUsuarios();
