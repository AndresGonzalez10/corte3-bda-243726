require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar SOLO las rutas que sí creamos
const mascotasRoutes = require('./routes/mascotasRoutes');
const vacunasRoutes = require('./routes/vacunasRoutes');

const app = express();

// Toma el puerto dinámico de la variable de entorno
const PORT = process.env.API_PORT_INTERNAL || 4000;

app.use(cors({
  origin: ['http://localhost:3001', 'http://clinica_frontend:3000'],
  credentials: true
}));
app.use(express.json());

// Montaje de rutas
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/vacunas', vacunasRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Corriendo en el puerto: ${PORT}`);
});