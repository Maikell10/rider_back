import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rideRoutes from './routes/rideRoutes';

const app = express();

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Montamos nuestras rutas
app.use('/api/rides', rideRoutes);

export default app;