const { Pool } = require('pg');
const USUARIOS = require('./users');

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'clinica_vet',
  user:     'postgres',
  password: 'postgres',
});

async function getAuthenticatedClient(username) {
  const usuario = USUARIOS[username];
  if (!usuario) throw new Error('Usuario no reconocido');

  const dedicatedPool = new Pool({
    host:     process.env.PG_HOST     || 'localhost',
    port:     parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'clinica_vet',
    user:     usuario.pgUser,
    password: usuario.pgPass,
  });

  const client = await dedicatedPool.connect();

  if (usuario.rol === 'veterinario' && usuario.vet_id !== null) {
    // HARDENING: vet_id viene de configuración interna, no de input
    await client.query(`SET LOCAL app.vet_id = $1`, [usuario.vet_id.toString()]);
  }

  return { client, usuario, dedicatedPool };
}

module.exports = { pool, getAuthenticatedClient };