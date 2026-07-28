const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/payments?estado=pendiente
router.get('/payments', async (req, res) => {
  const estado = req.query.estado || 'pendiente';
  try {
    const result = await pool.query(
      `SELECT p.*, pl.nombre AS plan_nombre, u.first, u.last, u.email
       FROM public.pagos p
       JOIN public.planes pl ON pl.id = p.plan_id
       JOIN public.users u ON u.id = p.usuario_id
       WHERE p.estado = $1
       ORDER BY p.fecha_pago ASC`,
      [estado]
    );
    res.json({ pagos: result.rows });
  } catch (err) {
    console.error('Error listando pagos (admin):', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/admin/payments/:id/approve  { dias_duracion: 30 }
router.post('/payments/:id/approve', async (req, res) => {
  const { id } = req.params;
  const diasDuracion = Number(req.body.dias_duracion) || 30;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pagoResult = await client.query(
      `SELECT * FROM public.pagos WHERE id = $1 AND estado = 'pendiente' FOR UPDATE`,
      [id]
    );
    const pago = pagoResult.rows[0];
    if (!pago) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado o ya procesado' });
    }

    await client.query(
      `UPDATE public.pagos
       SET estado = 'verificado', verificado_por = $1, fecha_verificacion = now()
       WHERE id = $2`,
      [req.user.id, id]
    );

    const subResult = await client.query(
      `INSERT INTO public.suscripciones (usuario_id, plan_id, pago_id, fecha_inicio, fecha_fin, estado)
       VALUES ($1, $2, $3, now(), now() + ($4 || ' days')::interval, 'activa')
       RETURNING *`,
      [pago.usuario_id, pago.plan_id, pago.id, diasDuracion]
    );

    await client.query('COMMIT');
    res.json({ suscripcion: subResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error aprobando pago:', err);
    res.status(500).json({ error: 'Error interno al aprobar' });
  } finally {
    client.release();
  }
});

// POST /api/admin/payments/:id/reject  { motivo: "..." }
router.post('/payments/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE public.pagos
       SET estado = 'rechazado', verificado_por = $1, fecha_verificacion = now(), motivo_rechazo = $2
       WHERE id = $3 AND estado = 'pendiente'
       RETURNING *`,
      [req.user.id, motivo || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado o ya procesado' });
    }
    res.json({ pago: result.rows[0] });
  } catch (err) {
    console.error('Error rechazando pago:', err);
    res.status(500).json({ error: 'Error interno al rechazar' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first, last, email, country, discord, rol, created_at FROM public.users ORDER BY id DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error listando usuarios (admin):', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
