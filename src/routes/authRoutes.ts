import { Router } from 'express';
import { requestOTP, verifyOTP, verifyIdentity } from '../controllers/authController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Rutas Públicas
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

router.post('/verify-identity', verifyToken, verifyIdentity);

export default router;