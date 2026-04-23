const { Pool } = require('pg');
const USUARIOS = require('./users');

const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     parseInt(process.env.PG_PORT_INTERNAL),
  database: process.env.POSTGRES_DB,
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function getAuthenticatedClient(username) {
  const usuario = USUARIOS[username];
  if (!usuario) throw new Error('Usuario no reconocido');

  const dedicatedPool = new Pool({
    host:     process.env.PG_HOST,
    port:     parseInt(process.env.PG_PORT_INTERNAL),
    database: process.env.POSTGRES_DB,
    user:     usuario.pgUser,
    password: usuario.pgPass,
  });

  const client = await dedicatedPool.connect();

  if (usuario.rol === 'veterinario' && usuario.vet_id !== null) {
    await client.query(`SET LOCAL app.vet_id = '${usuario.vet_id}'`);
  }

  return { client, usuario, dedicatedPool };
}

module.exports = { pool, getAuthenticatedClient };