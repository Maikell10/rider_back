import { Request, Response } from 'express';
import { PricingService } from '../services/pricingService';

export const quoteRide = async (req: Request, res: Response): Promise<void> => {
    try {
        const { distanceMeters, durationSeconds } = req.body;

        // Validaciones de seguridad
        if (!distanceMeters || !durationSeconds) {
            res.status(400).json({ error: 'Faltan parámetros geoespaciales.' });
            return;
        }

        // Caso de error: Prevención de viajes absurdamente largos o cortos
        if (distanceMeters < 100 || distanceMeters > 150000) {
            res.status(400).json({ error: 'La distancia del viaje está fuera de la zona de cobertura.' });
            return;
        }

        const fares = PricingService.calculateFares({ distanceMeters, durationSeconds });

        res.status(200).json({
            success: true,
            quotes: fares
        });

    } catch (error) {
        console.error("Error calculando tarifa:", error);
        res.status(500).json({ error: 'Error interno en el motor de precios.' });
    }
};