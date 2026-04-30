import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz Request de Express para inyectar los datos del usuario
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
        status: string;
    };
}

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Buscamos el token en las cabeceras HTTP (formato: "Bearer eyJhbGci...")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        // Validamos la firma criptográfica del JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        // Inyectamos la información en el Request para que el Controlador pueda usarla
        req.user = decoded;

        next(); // Permite que la petición continúe hacia el controlador
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// Middleware especializado para nuestro pilar de seguridad "Pink Ride"
export const requireVerifiedIdentity = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.status !== 'approved') {
        res.status(403).json({ error: 'Debes verificar tu identidad (Cédula/Selfie) para acceder a esta función.' });
        return;
    }
    next();
};