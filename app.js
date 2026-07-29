// 1. Configurar Supabase (Saca estos datos de Configuración > API en tu panel de Supabase)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = 'tu-anon-key-publica';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Generar el QR de Nequi
new QRCode(document.getElementById("qrcode"), {
    text: "3128482212",
    width: 150,
    height: 150,
    colorDark : "#000000",
    colorLight : "#ffffff",
});

// 3. Sistema de Autenticación
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Supabase maneja el login. Si el usuario no existe, puedes usar .signUp()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Error: " + error.message);
        return;
    }
    checkSession();
}

async function logout() {
    await supabase.auth.signOut();
    checkSession();
}

// 4. Controlar qué pantallas se ven
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-email').innerText = session.user.email;
        
        // Aquí podrías consultar la tabla 'profiles' para ver si es 'admin' o 'client'
        // Por ahora mostramos la vista de cliente
        document.getElementById('client-view').classList.remove('hidden');
    } else {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('client-view').classList.add('hidden');
    }
}

// 5. Enviar el pago a la Base de Datos
async function submitPayment() {
    const service = document.getElementById('service').value;
    const amount = document.getElementById('amount').value;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('payments').insert([
        { user_id: session.user.id, service_name: service, amount: amount }
    ]);

    if (error) {
        alert("Error al reportar pago: " + error.message);
    } else {
        alert("✅ Pago enviado a revisión. Un admin lo verificará pronto.");
        document.getElementById('amount').value = ''; // Limpiar campo
    }
}

// Ejecutar al cargar la página
checkSession();