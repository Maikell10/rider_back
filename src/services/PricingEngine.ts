import { Client, DistanceMatrixResponse } from '@googlemaps/google-maps-services-js';

// Inicializamos el cliente de Google Maps
const googleMapsClient = new Client({});

interface Coordinates {
    lat: number;
    lng: number;
}

interface QuoteResult {
    distanceKm: number;
    durationMins: number;
    estimatedFare: number;
    currency: string;
}

export class PricingEngine {
    /**
     * Calcula la tarifa estimada entre dos puntos
     */
    static async calculateFare(origin: Coordinates, destination: Coordinates, rideType: 'STANDARD' | 'PINK_RIDE'): Promise<QuoteResult> {
        try {
            // 1. Llamada a Google Distance Matrix API
            const response: DistanceMatrixResponse = await googleMapsClient.distancematrix({
                params: {
                    origins: [{ lat: origin.lat, lng: origin.lng }],
                    destinations: [{ lat: destination.lat, lng: destination.lng }],
                    key: process.env.GOOGLE_MAPS_API_KEY_BACKEND as string,
                },
                timeout: 5000 // Timeout prudente para no dejar colgada a la usuaria
            });

            const element = response.data.rows[0].elements[0];

            if (element.status !== 'OK') {
                throw new Error('Google Maps no pudo calcular la ruta.');
            }

            // Google devuelve distancia en metros y tiempo en segundos.
            const distanceKm = element.distance.value / 1000;
            const durationMins = element.duration.value / 60;

            // 2. Extraer parámetros financieros del entorno
            const baseFare = parseFloat(process.env.BASE_FARE || '1.50');
            const pricePerKm = parseFloat(process.env.PRICE_PER_KM || '0.50');
            const pricePerMin = parseFloat(process.env.PRICE_PER_MIN || '0.10');
            const surgeMultiplier = parseFloat(process.env.SURGE_MULTIPLIER || '1.0');

            // 3. Fórmula del negocio
            let subtotal = baseFare + (distanceKm * pricePerKm) + (durationMins * pricePerMin);

            // Regla de Negocio Ejemplo: Si es Pink Ride, el costo por minuto tiene un pequeño recargo de seguridad
            if (rideType === 'PINK_RIDE') {
                subtotal += (durationMins * 0.05);
            }

            const totalFare = subtotal * surgeMultiplier;

            return {
                distanceKm: parseFloat(distanceKm.toFixed(2)),
                durationMins: Math.ceil(durationMins), // Redondeamos minutos hacia arriba
                estimatedFare: parseFloat(totalFare.toFixed(2)),
                currency: 'USD'
            };

        } catch (error) {
            console.error('Error en PricingEngine:', error);
            throw new Error('No se pudo calcular la tarifa en este momento.');
        }
    }
}