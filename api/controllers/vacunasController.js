const { pool, getAuthenticatedClient } = require('../config/database');
const redisClient = require('../config/redis');

const CACHE_KEY_VACUNACION = 'vacunacion_pendiente';
const CACHE_TTL_SEGUNDOS = 300;

const obtenerVacunacionPendiente = async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY_VACUNACION);
    if (cached) {
      console.log(`[CACHE HIT] ${CACHE_KEY_VACUNACION} — devolviendo desde Redis`);
      return res.json({ data: JSON.parse(cached), fromCache: true });
    }

    console.log(`[CACHE MISS] ${CACHE_KEY_VACUNACION} — consultando PostgreSQL`);
    const inicio = Date.now();
    const result = await pool.query(`SELECT * FROM v_mascotas_vacunacion_pendiente`);
    const latencia = Date.now() - inicio;
    console.log(`[DB] Consulta completada en ${latencia}ms`);

    await redisClient.setEx(CACHE_KEY_VACUNACION, CACHE_TTL_SEGUNDOS, JSON.stringify(result.rows));
    res.json({ data: result.rows, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const aplicarVacuna = async (req, res) => {
  const { mascota_id, vacuna_id, fecha_aplicacion, costo_cobrado } = req.body;

  if (!Number.isInteger(Number(mascota_id)) || !Number.isInteger(Number(vacuna_id))) {
    return res.status(400).json({ error: 'mascota_id y vacuna_id deben ser enteros' });
  }

  let client, dedicatedPool;
  try {
    const auth = await getAuthenticatedClient(req.username);
    client = auth.client;
    dedicatedPool = auth.dedicatedPool;

    await client.query('BEGIN');
    if (auth.usuario.rol === 'veterinario' && auth.usuario.vet_id !== null) {
      await client.query(`SET LOCAL app.vet_id = $1`, [auth.usuario.vet_id.toString()]);
    }

    await client.query(`
      INSERT INTO vacunas_aplicadas
        (mascota_id, vacuna_id, veterinario_id, fecha_aplicacion, costo_cobrado)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      mascota_id, vacuna_id, auth.usuario.vet_id,
      fecha_aplicacion || new Date().toISOString().split('T')[0],
      costo_cobrado || null
    ]);

    await client.query('COMMIT');
    await redisClient.del(CACHE_KEY_VACUNACION);
    console.log(`[CACHE INVALIDADO] ${CACHE_KEY_VACUNACION}`);

    res.json({ ok: true, mensaje: 'Vacuna aplicada y caché invalidado' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
    if (dedicatedPool) await dedicatedPool.end();
  }
};

module.exports = { obtenerVacunacionPendiente, aplicarVacuna };