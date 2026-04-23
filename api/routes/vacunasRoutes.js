const express = require('express');
const router = express.Router();
const extractUser = require('../middlewares/auth');
const { obtenerVacunacionPendiente, aplicarVacuna } = require('../controllers/vacunasController');

router.get('/pendientes', extractUser, obtenerVacunacionPendiente);
router.post('/aplicar', extractUser, aplicarVacuna);

module.exports = router;