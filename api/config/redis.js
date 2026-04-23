const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT_INTERNAL),
  }
});

redisClient.connect()
  .then(() => console.log('[REDIS] Conectado correctamente'))
  .catch(err => console.error('[REDIS] Error de conexión:', err));

module.exports = redisClient;