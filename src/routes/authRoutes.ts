import { Router } from 'express';
import { requestOTP, verifyOTP } from '../controllers/authController';
import { verifyToken, requireVerifiedIdentity } from '../middlewares/authMiddleware';

const router = Router();

// Rutas Públicas
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

// Ejemplo de ruta Protegida (Para subir la foto de la cédula)
router.post('/verify-identity', verifyToken, (req, res) => {
    // Aquí iría la lógica para procesar la imagen S3 y actualizar MySQL
    res.json({ message: 'Documentos recibidos. En revisión.' });
});

export default router;