const { getAuthenticatedClient } = require('../config/database');

const buscarMascotas = async (req, res) => {
  const nombre = req.query.nombre || '';
  let client, dedicatedPool;
  
  try {
    const auth = await getAuthenticatedClient(req.username);
    client = auth.client;
    dedicatedPool = auth.dedicatedPool;

    await client.query('BEGIN');
    if (auth.usuario.rol === 'veterinario' && auth.usuario.vet_id !== null) {
      await client.query(`SET LOCAL app.vet_id = $1`, [auth.usuario.vet_id.toString()]);
    }

    // HARDENING PRINCIPAL: Parámetro posicional $1 para evitar SQL Injection
    const sql = `
      SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento,
             d.nombre AS dueno, d.telefono, d.email
      FROM mascotas m
      JOIN duenos d ON d.id = m.dueno_id
      WHERE m.nombre ILIKE $1
      ORDER BY m.nombre
    `;
    const result = await client.query(sql, [`%${nombre}%`]);
    await client.query('COMMIT');
    
    res.json({ data: result.rows, rol: auth.usuario.rol });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
    if (dedicatedPool) await dedicatedPool.end();
  }
};

const listarMascotas = async (req, res) => {
  let client, dedicatedPool;
  try {
    const auth = await getAuthenticatedClient(req.username);
    client = auth.client;
    dedicatedPool = auth.dedicatedPool;

    await client.query('BEGIN');
    if (auth.usuario.rol === 'veterinario' && auth.usuario.vet_id !== null) {
      await client.query(`SET LOCAL app.vet_id = $1`, [auth.usuario.vet_id.toString()]);
    }

    const result = await client.query(`
      SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento,
             d.nombre AS dueno, d.telefono
      FROM mascotas m
      JOIN duenos d ON d.id = m.dueno_id
      ORDER BY m.nombre
    `);

    await client.query('COMMIT');
    res.json({ data: result.rows, rol: auth.usuario.rol });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
    if (dedicatedPool) await dedicatedPool.end();
  }
};

module.exports = { buscarMascotas, listarMascotas };