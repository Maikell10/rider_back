import { Router } from 'express';
import { quoteRide } from '../controllers/rideController';
import { requireVerifiedIdentity, verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint para cotizar. Idealmente, protegemos esta ruta con el middleware de JWT
router.post('/quote', verifyToken, requireVerifiedIdentity, quoteRide);

export default router;