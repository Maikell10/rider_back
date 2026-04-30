import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rideRoutes from './routes/rideRoutes';
import authRoutes from './routes/authRoutes'

const app = express();

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Prueba de vida para Vercel
app.get("/", (req, res) => {
    res.send("API de Rides: El servidor está vivo y funcionando 🚀");
});

// Montamos nuestras rutas
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

export default app;