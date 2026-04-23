const express = require('express');
const router = express.Router();
const extractUser = require('../middlewares/auth');
const { buscarMascotas, listarMascotas } = require('../controllers/mascotasController');

router.get('/buscar', extractUser, buscarMascotas);
router.get('/', extractUser, listarMascotas);

module.exports = router;