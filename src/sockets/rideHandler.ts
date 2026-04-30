import { Server, Socket } from 'socket.io';

export const handleRideEvents = (io: Server, socket: Socket) => {
    // Escuchamos el evento exacto que emite nuestro Zustand en el Frontend
    socket.on('request_ride', async (payload) => {
        const { origin, destination, rideType } = payload;

        // Extraemos los datos seguros del usuario que validó el middleware
        const user = socket.data.user;

        console.log(`🚕 Nueva solicitud de viaje [Tipo: ${rideType}] de usuaria: ${user.userId}`);
        console.log(`📍 Origen: ${origin.latitude}, ${origin.longitude}`);
        console.log(`🏁 Destino: ${destination.latitude}, ${destination.longitude}`);

        // NOTA ARQUITECTÓNICA: 
        // Aquí conectaremos Redis (GEORADIUS) más adelante para buscar conductoras reales.

        // --- SIMULADOR DE ASIGNACIÓN (MOCK) ---
        // Vamos a simular que el servidor tarda 4 segundos buscando, y luego encuentra a una conductora.
        setTimeout(() => {
            console.log(`✅ Conductora 'Pink Ride' encontrada para la usuaria ${user.userId}`);

            // Emitimos SOLO a la sala privada de la pasajera que pidió el viaje
            io.to(user.userId).emit('ride_accepted', {
                driver: {
                    name: 'Ana Mendoza',
                    vehiclePlates: 'AB-123-CD',
                    rating: 4.9,
                    photoUrl: 'https://img.magnific.com/foto-gratis/calma-al-volante-carretera-mujer-conductora-segura-si-misma-perfil_169016-69256.jpg?semt=ais_hybrid&w=740&q=80'
                },
                pin: '8492' // Nuestro PIN de seguridad
            });
        }, 4000);
    });
};