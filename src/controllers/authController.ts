import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// NOTA: En producción, usaríamos Twilio, Firebase o AWS SNS para enviar el SMS.
// Usamos un objeto en memoria temporal para simular una base de datos/Redis para los OTP.
const otpStore = new Map<string, string>();

export const requestOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;

        if (!phone) {
            res.status(400).json({ error: 'El número de teléfono es obligatorio.' });
            return;
        }

        // Generamos un código de 6 dígitos
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardamos el OTP asociado al teléfono (En producción: usar Redis con TTL de 5 mins)
        otpStore.set(phone, otpCode);

        console.log(`[SIMULADOR SMS] Enviando código ${otpCode} al número ${phone}`);

        res.status(200).json({ message: 'Código de verificación enviado con éxito.' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, code } = req.body;

        const storedCode = otpStore.get(phone);

        if (!storedCode || storedCode !== code) {
            res.status(401).json({ error: 'Código inválido o expirado.' });
            return;
        }

        // OTP Válido. Limpiamos la caché.
        otpStore.delete(phone);

        // Aquí consultaríamos MySQL: SELECT * FROM Users WHERE phone = phone
        // Si no existe, lo creamos. Simularemos los datos del usuario:
        const user = {
            id: 'uuid-1234-5678',
            phone: phone,
            role: 'passenger',
            verification_status: 'pending' // ¡Aún no puede pedir viajes!
        };

        // Generamos el Token JWT (El Contrato de Confianza)
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                status: user.verification_status
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' } // El token expira en 30 días
        );

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al verificar el código.' });
    }
};