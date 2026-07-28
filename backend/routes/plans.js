const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/plans -> catálogo público de planes activos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.planes WHERE activo = true ORDER BY tipo, precio'
    );
    res.json({ planes: result.rows });
  } catch (err) {
    console.error('Error listando planes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/plans/metodos-pago -> métodos de pago activos con datos reales
router.get('/metodos-pago', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, datos FROM public.metodos_pago WHERE activo = true ORDER BY nombre'
    );
    res.json({ metodos: result.rows });
  } catch (err) {
    console.error('Error listando métodos de pago:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
