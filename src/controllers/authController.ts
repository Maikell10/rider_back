import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'; // Instala con: npm install uuid && npm install -D @types/uuid
import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';

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

        // BUSCAMOS O CREAMOS EL USUARIO EN MYSQL
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE phone = ?', [phone]);
        let user = rows[0];

        if (!user) {
            // El usuario no existe, lo registramos por primera vez
            const newUserId = uuidv4();
            await pool.execute(
                'INSERT INTO Users (id, phone, role, verification_status) VALUES (?, ?, ?, ?)',
                [newUserId, phone, 'passenger', 'pending']
            );

            // Lo recuperamos para tener el objeto completo
            const [newRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE id = ?', [newUserId]);
            user = newRows[0];
            console.log('Nuevo usuario registrado:', user.phone);
        }

        // Generamos el Token JWT usando los datos reales de la BD
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
        res.status(500).json({ error: 'Error al verificar el código.' });
    }
};