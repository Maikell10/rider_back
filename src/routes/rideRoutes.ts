import { Router } from 'express';
import { quoteRide } from '../controllers/rideController';
// import { verifyToken } from '../middlewares/auth'; // Descomenta cuando agreguemos JWT

const router = Router();

// Endpoint para cotizar. Idealmente, protegemos esta ruta con el middleware de JWT
router.post('/quote', /* verifyToken, */ quoteRide);

export default router;