import { Server, Socket } from 'socket.io';

export const handleRideEvents = (io: Server, socket: Socket) => {

    // 1. ESCUCHAR: La pasajera pide un viaje
    socket.on('request_ride', (data) => {
        const user = socket.data.user;

        // 🛡️ FIX ARQUITECTÓNICO: Garantizar un ID. 
        // Si user.id falla, usamos socket.id que es 100% seguro y único para esa sesión.
        const safePassengerId = user.id || user.userId || socket.id;

        console.log(`🚀 Viaje solicitado por: ${user.name} (${data.rideType})`);

        // Estructuramos la oferta para las conductoras
        const rideOffer = {
            rideId: `RIDE-${Math.random().toString(36).toUpperCase().substr(2, 7)}`,
            passenger: {
                id: safePassengerId, // <--- ¡ESTO ES LO QUE FALTABA!
                name: user.name || 'Pasajera Frecuente',
                rating: 5.0,
                phone: user.phone
            },
            origin: data.origin,
            destination: data.destination,
            rideType: data.rideType,
            estimatedPrice: 0, // Aquí podrías recalcular si quieres seguridad extra
        };

        // ENVIAR: Solo a las conductoras que están en la sala 'drivers_room'
        // Usamos broadcast para que NO le llegue a la pasajera que lo pidió
        socket.to('drivers_room').emit('new_ride_available', rideOffer);

        console.log(`📢 Oferta enviada a la sala de conductoras.`);
    });

    // 2. ESCUCHAR: La conductora acepta el viaje
    socket.on('accept_ride', (data) => {
        const driver = socket.data.user;
        const { rideId, passengerId } = data;

        console.log(`✅ Viaje ${rideId} aceptado por la conductora ${driver.name}`);

        // Generamos el PIN de seguridad de 4 dígitos
        const securityPIN = Math.floor(1000 + Math.random() * 9000).toString();

        // NOTIFICAR A LA PASAJERA: Le enviamos los datos de la conductora y el PIN
        io.to(passengerId).emit('ride_accepted', {
            rideId,
            pin: securityPIN,
            driver: {
                name: driver.name,
                vehiclePlates: driver.vehicle_plates || "ABC-123", // Lo que tengas en la BD
                rating: 5.0,
                photoUrl: "https://via.placeholder.com/150"
            }
        });

        // Sacamos a la conductora de la sala de ofertas para que no le lleguen más mientras viaja
        socket.leave('drivers_room');
    });

    // 3. ESCUCHAR: La pasajera cancela la búsqueda
    socket.on('cancel_ride_request', () => {
        // En una app real, aquí emitiríamos a 'drivers_room' un evento 'ride_cancelled' 
        // para desaparecer la tarjeta flotante si la conductora no la ha aceptado aún.
        console.log(`🛑 Búsqueda cancelada por el socket: ${socket.id}`);
    });

    // 4. ESCUCHAR: Actualización de ubicación en tiempo real de la conductora
    socket.on('driver_location_update', (data) => {
        const { passengerId, location } = data;

        // Enrutamos la ubicación estrictamente a la sala privada de la pasajera.
        // Cero fugas de datos. Privacidad total.
        socket.to(passengerId).emit('driver_location_update', location);
    });

    // 5. ESCUCHAR: La conductora indica que llegó al punto de recogida
    socket.on('driver_arrived', (data) => {
        const { passengerId, rideId } = data;
        const driver = socket.data.user;

        console.log(`📍 Conductora ${driver.name} llegó al punto para el viaje ${rideId}`);

        // Notificamos a la pasajera en su canal seguro
        socket.to(passengerId).emit('driver_arrived', {
            rideId,
            message: "Tu conductora está afuera."
        });
    });
};