const express = require('express');
const multer = require('multer');
const pool = require('../db');
const supabaseAdmin = require('../supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

const BUCKET = 'comprobantes';

// POST /api/payments -> cliente reporta un pago (con o sin imagen de comprobante)
router.post('/', requireAuth, upload.single('comprobante'), async (req, res) => {
  const { plan_id, metodo_pago, monto, moneda, referencia } = req.body;

  if (!plan_id || !metodo_pago || !monto) {
    return res.status(400).json({ error: 'Faltan plan_id, metodo_pago o monto' });
  }

  try {
    let comprobante_url = null;

    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const path = `${req.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) {
        console.error('Error subiendo comprobante:', uploadError);
        return res.status(500).json({ error: 'No se pudo subir el comprobante' });
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      comprobante_url = publicUrlData.publicUrl;
    }

    const result = await pool.query(
      `INSERT INTO public.pagos (usuario_id, plan_id, metodo_pago, monto, moneda, comprobante_url, referencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, plan_id, metodo_pago, monto, moneda || 'USD', comprobante_url, referencia || null]
    );

    res.status(201).json({ pago: result.rows[0] });
  } catch (err) {
    console.error('Error reportando pago:', err);
    res.status(500).json({ error: 'Error interno al reportar el pago' });
  }
});

// GET /api/payments/me -> historial de pagos del usuario logueado
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pl.nombre AS plan_nombre
       FROM public.pagos p
       JOIN public.planes pl ON pl.id = p.plan_id
       WHERE p.usuario_id = $1
       ORDER BY p.fecha_pago DESC`,
      [req.user.id]
    );
    res.json({ pagos: result.rows });
  } catch (err) {
    console.error('Error listando pagos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/payments/subscriptions/me -> suscripciones activas del usuario
router.get('/subscriptions/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, pl.nombre AS plan_nombre, pl.tipo
       FROM public.suscripciones s
       JOIN public.planes pl ON pl.id = s.plan_id
       WHERE s.usuario_id = $1
       ORDER BY s.fecha_inicio DESC`,
      [req.user.id]
    );
    res.json({ suscripciones: result.rows });
  } catch (err) {
    console.error('Error listando suscripciones:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
