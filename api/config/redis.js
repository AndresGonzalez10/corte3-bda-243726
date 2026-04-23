const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  }
});

redisClient.connect()
  .then(() => console.log('[REDIS] Conectado correctamente'))
  .catch(err => console.error('[REDIS] Error de conexión:', err));

module.exports = redisClient;