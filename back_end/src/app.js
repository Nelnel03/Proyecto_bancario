const express = require('express');
const cors    = require('cors');

const app = express();

// ─── 1. CORS ──────────────────────────────────────────────────────────────────
//
// CORS (Cross-Origin Resource Sharing) es un mecanismo de seguridad del
// navegador que bloquea peticiones HTTP entre dominios distintos a menos
// que el servidor las autorice explícitamente.
//
// Ejemplo del problema sin CORS:
//   Tu frontend corre en  http://localhost:5173  (React/Vue/etc.)
//   Tu API corre en       http://localhost:3000
//   → El navegador bloquea la petición porque los puertos son diferentes.
//
// Con este middleware el servidor agrega cabeceras HTTP como:
//   Access-Control-Allow-Origin: http://localhost:5173
//   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
//   Access-Control-Allow-Headers: Content-Type, Authorization
//
// ¿Qué hace ALLOWED_ORIGINS?
//   Es una variable de entorno donde listamos, separados por coma, todos
//   los dominios autorizados. Así en producción solo tu frontend real puede
//   consumir la API y no cualquier sitio externo.
//
//   Ejemplos:
//     Desarrollo:  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
//     Producción:  ALLOWED_ORIGINS=https://mibanco.com
//
// Si la variable no está definida se usa http://localhost:5173 por defecto.

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  // origin: función que se ejecuta por cada petición entrante.
  //   - origin   → dominio desde donde viene la petición (ej. http://localhost:5173)
  //   - callback → función para aprobar (null, true) o rechazar (Error, false)
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (Postman, Thunder Client, curl, apps móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // Origen autorizado → se agrega la cabecera y se permite la petición
      return callback(null, true);
    }

    // Origen no autorizado → el navegador bloqueará la respuesta
    callback(new Error(`CORS bloqueado: el origen "${origin}" no está permitido`));
  },

  // Métodos HTTP que el frontend puede usar
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Cabeceras que el frontend puede enviar en sus peticiones
  // "Authorization" es necesario para enviar el token JWT: Bearer <token>
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Permite que el navegador reciba cookies y cabeceras de autenticación
  // en peticiones cross-origin (útil si en el futuro usas cookies de sesión)
  credentials: true,
}));

// ─── 2. BODY PARSER ───────────────────────────────────────────────────────────
// Permite leer el cuerpo de las peticiones POST/PUT como JSON.
// Sin esto req.body sería undefined.
app.use(express.json());

// ─── 3. RUTA DE SALUD ─────────────────────────────────────────────────────────
// Endpoint simple para verificar que el servidor está corriendo.
// Útil para monitoreo o para hacer un "ping" desde el frontend antes de operar.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── 4. RUTAS PRINCIPALES ─────────────────────────────────────────────────────
// Cada archivo de rutas agrupa los endpoints de un recurso.
// El prefijo /api/ deja claro que son rutas de la API y facilita versionar
// en el futuro (ej. /api/v2/...).
app.use('/api/auth',         require('./routes/auth'));         // Registro y login
app.use('/api/users',        require('./routes/users'));        // Gestión de usuarios
app.use('/api/accounts',     require('./routes/accounts'));     // Cuentas bancarias
app.use('/api/transactions', require('./routes/transactions')); // Operaciones financieras
app.use('/api/admin',        require('./routes/admin'));        // Panel de administración

// ─── 5. MANEJO DE RUTAS NO ENCONTRADAS (404) ──────────────────────────────────
// Si ninguna ruta coincide con la petición, se devuelve un error 404 en JSON.
// Es importante responder en JSON (no HTML) porque es una API REST.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── 6. MANEJO GLOBAL DE ERRORES ──────────────────────────────────────────────
// Express detecta que este middleware es un manejador de errores porque
// recibe 4 parámetros: (err, req, res, next).
//
// Captura dos tipos de errores:
//   a) Errores lanzados con "throw" dentro de cualquier controlador async
//      (Express 5 los propaga automáticamente sin necesidad de try/catch)
//   b) El error de CORS que generamos arriba cuando el origen no está permitido
//
// err.status → código HTTP personalizado (ej. 404, 422)
// err.message → mensaje descriptivo del error
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
