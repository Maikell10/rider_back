import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

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

        let otpCode;

        // --- MODO DESARROLLADOR: BYPASS ---
        if (phone === '00000000000') {
            otpCode = '123456'; // Siempre será este código para el número de prueba
        } else {
            // Generación normal para el resto
            otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        // ----------------------------------

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

        // --- MODO DESARROLLADOR: BYPASS MAESTRO ---
        // Si es nuestro número de pruebas de 11 ceros y la clave es 123456, pasamos directo
        const isBypass = (phone === '00000000000' && code === '123456');

        if (!isBypass) {
            // Flujo normal para usuarios reales
            const storedCode = otpStore.get(phone);

            if (!storedCode || storedCode !== code) {
                res.status(401).json({ error: 'Código inválido o expirado.' });
                return;
            }
            // OTP Válido. Limpiamos la caché.
            otpStore.delete(phone);
        }
        // ------------------------------------------

        // BUSCAMOS O CREAMOS EL USUARIO EN MYSQL
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE phone = ?', [phone]);
        let user = rows[0];

        if (!user) {
            // El usuario no existe, lo registramos usando Node.js Nativo
            const { randomUUID } = require('crypto');
            const newUserId = randomUUID();

            await pool.execute(
                'INSERT INTO Users (id, phone, role, verification_status) VALUES (?, ?, ?, ?)',
                [newUserId, phone, 'passenger', 'pending']
            );

            const [newRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE id = ?', [newUserId]);
            user = newRows[0];
            console.log('Nuevo usuario registrado:', user.phone);
        }

        // Generamos el Token JWT usando los datos de la BD
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                status: user.verification_status
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user: { id: user.id, phone: user.phone, role: user.role, status: user.verification_status }
        });
    } catch (error: any) {
        console.error("Error en verifyOTP:", error);
        res.status(500).json({ error: 'Error al verificar el código.' });
    }
};

export const verifyIdentity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Usuario no autenticado.' });
            return;
        }

        // 1. Actualizamos el estado en la Base de Datos a 'approved'
        await pool.execute(
            'UPDATE Users SET verification_status = "approved" WHERE id = ?',
            [userId]
        );

        // 2. Buscamos los datos actualizados
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = rows[0];

        // 3. Generamos un NUEVO Token JWT que ahora tiene status: 'approved'
        const newToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                status: user.verification_status
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: 'Identidad verificada con éxito',
            token: newToken
        });

    } catch (error: any) {
        console.error("Error en verifyIdentity:", error);
        res.status(500).json({ error: 'Error interno al procesar la verificación.' });
    }
};