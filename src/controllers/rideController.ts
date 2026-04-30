import { Request, Response } from 'express';
import { PricingEngine } from '../services/PricingEngine';

export const quoteRide = async (req: Request, res: Response): Promise<void> => {
    try {
        const { origin, destination, rideType } = req.body;

        // Validación básica
        if (!origin || !destination || !origin.lat || !destination.lat) {
            res.status(400).json({ error: 'Faltan coordenadas de origen o destino.' });
            return;
        }

        // Llamamos a nuestro servicio de negocio
        const quote = await PricingEngine.calculateFare(
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng },
            rideType || 'STANDARD'
        );

        // Generamos un ID de cotización efímero (podría guardarse en Redis con un TTL de 5 mins)
        const quoteId = `qte_${Date.now()}`;

        res.status(200).json({
            quoteId,
            ...quote
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};