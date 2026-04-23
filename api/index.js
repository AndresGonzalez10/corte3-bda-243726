require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const mascotasRoutes = require('./routes/mascotasRoutes');
const vacunasRoutes = require('./routes/vacunasRoutes');
const citasRoutes = require('./routes/citasRoutes'); // Asumiendo que crearás este archivo
const veterinariosRoutes = require('./routes/veterinariosRoutes'); // Asumiendo que crearás este archivo

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/api/login', authRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/vacunas', vacunasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/veterinarios', veterinariosRoutes);

app.listen(PORT, () => {
  console.log(`[API] Corriendo en http://localhost:${PORT}`);
});