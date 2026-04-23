const USUARIOS = require('../config/users');

function extractUser(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const username   = authHeader.replace('Bearer ', '').trim();
  
  if (!username || !USUARIOS[username]) {
    return res.status(401).json({ error: 'No autenticado o usuario inválido' });
  }
  
  req.username = username;
  req.usuario  = USUARIOS[username];
  next();
}

module.exports = extractUser;