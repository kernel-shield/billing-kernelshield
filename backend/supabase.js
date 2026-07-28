const { createClient } = require('@supabase/supabase-js');

// Usa la service_role key: solo se usa en el backend, NUNCA la mandes al frontend.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = supabaseAdmin;
