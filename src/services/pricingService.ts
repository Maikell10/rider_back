export interface RouteData {
    distanceMeters: number; // Ej: 5860 del JSON que pasaste
    durationSeconds: number; // Ej: 465 del JSON
}

export class PricingService {
    // Tarifas base (En producción, esto se lee de una tabla en MySQL para poder ajustarlo en caliente)
    private static BASE_FARE = 1.00;
    private static PRICE_PER_KM = 0.35;
    private static PRICE_PER_MINUTE = 0.12;

    // Multiplicador de exclusividad para conductoras verificadas
    private static PINK_RIDE_MULTIPLIER = 1.15;

    public static calculateFares(route: RouteData) {
        const distanceKm = route.distanceMeters / 1000;
        const durationMinutes = route.durationSeconds / 60;

        const basePrice = this.BASE_FARE + (distanceKm * this.PRICE_PER_KM) + (durationMinutes * this.PRICE_PER_MINUTE);

        // Agregamos una tarifa de plataforma (10%)
        const standardTotal = basePrice * 1.10;
        const pinkRideTotal = standardTotal * this.PINK_RIDE_MULTIPLIER;

        return {
            standard: parseFloat(standardTotal.toFixed(2)),
            pinkRide: parseFloat(pinkRideTotal.toFixed(2)),
            currency: 'USD',
            distanceText: `${distanceKm.toFixed(1)} km`, // Formateado para la UI
            durationText: `${Math.round(durationMinutes)} min`
        };
    }
}