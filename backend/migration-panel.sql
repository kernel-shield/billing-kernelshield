-- Ejecutar esto en Supabase -> SQL Editor
-- Agrega rol de admin/cliente a la tabla users existente
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'cliente';

-- Planes disponibles (SA-MP, MTA, FiveM, VPS, etc.)
CREATE TABLE IF NOT EXISTS public.planes (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL,
  precio numeric(10,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'USD',
  descripcion text,
  ram text,
  cpu text,
  disco text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Métodos de pago editables sin tocar código
CREATE TABLE IF NOT EXISTS public.metodos_pago (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  datos text NOT NULL,
  activo boolean NOT NULL DEFAULT true
);

-- Pagos reportados por clientes
CREATE TABLE IF NOT EXISTS public.pagos (
  id serial PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id integer NOT NULL REFERENCES public.planes(id),
  metodo_pago text NOT NULL,
  monto numeric(10,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'USD',
  comprobante_url text,
  referencia text,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | verificado | rechazado
  motivo_rechazo text,
  fecha_pago timestamptz NOT NULL DEFAULT now(),
  verificado_por integer REFERENCES public.users(id),
  fecha_verificacion timestamptz
);

-- Suscripciones activas generadas al aprobar un pago
CREATE TABLE IF NOT EXISTS public.suscripciones (
  id serial PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id integer NOT NULL REFERENCES public.planes(id),
  pago_id integer NOT NULL REFERENCES public.pagos(id),
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'activa' -- activa | vencida | cancelada
);

-- Seed de métodos de pago (edita datos reales aquí o desde el panel admin más adelante)
INSERT INTO public.metodos_pago (nombre, datos, activo) VALUES
  ('PayPal', 'saylinv2782@gmail.com', true),
  ('Nequi', '3128482212', true),
  ('Binance Pay', 'UID 1216562025', true)
ON CONFLICT DO NOTHING;

-- Seed de planes de ejemplo (edita precios/nombres reales aquí)
INSERT INTO public.planes (nombre, tipo, precio, descripcion, ram, cpu, disco) VALUES
  ('SA-MP Básico', 'samp', 3.00, 'Servidor SA-MP para empezar', '1GB', '1 vCPU', '10GB'),
  ('MTA Básico', 'mta', 3.00, 'Servidor MTA:SA', '1GB', '1 vCPU', '10GB'),
  ('FiveM Estándar', 'fivem', 6.00, 'Servidor FiveM con buen rendimiento', '2GB', '2 vCPU', '20GB'),
  ('VPS 4GB', 'vps', 10.00, 'VPS genérico', '4GB', '2 vCPU', '40GB'),
  ('Discord Bot', 'discord bot', 2.00, 'Hosting 24/7 para bot de Discord', '512MB', '0.5 vCPU', '5GB')
ON CONFLICT DO NOTHING;

-- IMPORTANTE: convertite en admin manualmente después de registrarte, reemplazando el email:
-- UPDATE public.users SET rol = 'admin' WHERE email = 'tu_email@ejemplo.com';
